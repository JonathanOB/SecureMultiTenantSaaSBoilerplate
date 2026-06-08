"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fromError, ForbiddenError, UnauthorizedError } from "@/lib/api/response";
import type { ActionResult, OrgRole } from "@/types";

async function getContext() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) throw new ForbiddenError("No active organization.");

  const membership = await prisma.organizationMembership.findFirst({
    where: { orgId, user: { clerkId: userId } },
  });
  if (!membership) throw new ForbiddenError("Not a member.");

  return { userId, orgId, role: membership.role as OrgRole, membershipId: membership.id };
}

// ── Update org settings ────────────────────────────────────────────────────────

const UpdateOrgSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(63)
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens."),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export async function updateOrgSettings(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { orgId, role, membershipId } = await getContext();
    requirePermission(role, "org:update");

    const parsed = UpdateOrgSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      logoUrl: formData.get("logoUrl") ?? "",
    });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { data: null, error: { code: "VALIDATION_ERROR", message } };
    }

    const { name, slug, logoUrl } = parsed.data;

    // Check slug uniqueness (excluding current org).
    const existing = await prisma.organization.findFirst({
      where: { slug, NOT: { id: orgId } },
    });
    if (existing) {
      return { data: null, error: { code: "SLUG_TAKEN", message: "That slug is already taken." } };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        name,
        slug,
        logoUrl: logoUrl || null,
      },
    });

    writeAuditLog({
      orgId,
      userId: membershipId,
      action: "settings.updated",
      resource: "organization",
      resourceId: orgId,
      metadata: { name, slug },
    });

    revalidatePath("/dashboard/settings");
    return ok(null);
  } catch (e) {
    return fromError(e);
  }
}

// ── Delete organisation ────────────────────────────────────────────────────────

const DeleteOrgSchema = z.object({ confirmName: z.string() });

export async function deleteOrganization(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { orgId, role } = await getContext();
    requirePermission(role, "org:delete");

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

    const { confirmName } = DeleteOrgSchema.parse({ confirmName: formData.get("confirmName") });
    if (confirmName !== org.name) {
      return {
        data: null,
        error: { code: "CONFIRM_MISMATCH", message: "Organization name does not match." },
      };
    }

    await prisma.organization.delete({ where: { id: orgId } });

    redirect("/");
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return fromError(e);
  }
}
