"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
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
    include: { user: true },
  });
  if (!membership) throw new ForbiddenError("Not a member.");

  return { userId: membership.userId, orgId, role: membership.role as OrgRole };
}

// ── Create API key ─────────────────────────────────────────────────────────────

const CreateKeySchema = z.object({
  name: z.string().trim().min(1).max(100),
  expiresIn: z.enum(["30", "90", "365", "never"]),
  scopes: z.string().transform((s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  ),
});

/** Returns the full plaintext key only once — it is never stored. */
export async function createApiKey(
  _prev: ActionResult<{ id: string; plainKey: string } | null>,
  formData: FormData
): Promise<ActionResult<{ id: string; plainKey: string } | null>> {
  try {
    const { userId, orgId, role } = await getContext();
    requirePermission(role, "apikey:create");

    const parsed = CreateKeySchema.safeParse({
      name: formData.get("name"),
      expiresIn: formData.get("expiresIn"),
      scopes: formData.get("scopes") ?? "",
    });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid input.";
      return { data: null, error: { code: "VALIDATION_ERROR", message: msg } };
    }

    const { name, expiresIn, scopes } = parsed.data;

    // Generate: 32 random bytes → hex string. Prefix with "sk_" for recognition.
    const rawKey = `sk_${randomBytes(32).toString("hex")}`;
    const prefix = rawKey.slice(0, 8);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    let expiresAt: Date | null = null;
    if (expiresIn !== "never") {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn, 10));
    }

    const created = await prisma.apiKey.create({
      data: { orgId, userId, name, keyHash, prefix, scopes, expiresAt },
    });

    writeAuditLog({
      orgId,
      userId,
      action: "apikey.created",
      resource: "api_key",
      resourceId: created.id,
    });

    revalidatePath("/dashboard/settings/api-keys");
    return ok({ id: created.id, plainKey: rawKey });
  } catch (e) {
    return fromError(e);
  }
}

// ── Revoke API key ─────────────────────────────────────────────────────────────

export async function revokeApiKey(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { userId, orgId, role } = await getContext();
    requirePermission(role, "apikey:revoke");

    const keyId = z.string().cuid().parse(formData.get("keyId"));

    await prisma.apiKey.updateMany({
      where: { id: keyId, orgId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    writeAuditLog({
      orgId,
      userId,
      action: "apikey.revoked",
      resource: "api_key",
      resourceId: keyId,
    });

    revalidatePath("/dashboard/settings/api-keys");
    return ok(null);
  } catch (e) {
    return fromError(e);
  }
}
