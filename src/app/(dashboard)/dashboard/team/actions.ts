"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/clerk";
import { requirePermission } from "@/lib/auth/permissions";
import { checkOrgLimit } from "@/lib/billing/subscriptions";
import { sendEmail } from "@/lib/email/resend";
import { InviteEmail, inviteEmailText } from "@/lib/email/templates/invite";
import { writeAuditLog } from "@/lib/audit/log";
import { ok, fromError, ForbiddenError } from "@/lib/api/response";
import type { ActionResult } from "@/types";
import type { OrgRole } from "@/types";

async function getContext() {
  const session = await requireAuth();
  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) throw new ForbiddenError("No active organization.");

  const membership = await prisma.organizationMembership.findFirst({
    where: { orgId, user: { clerkId: session.userId } },
    include: { user: true },
  });
  if (!membership) throw new ForbiddenError("Not a member of this organization.");

  return { session, orgId, membership };
}

// ── Invite member ──────────────────────────────────────────────────────────────

const InviteSchema = z.object({ email: z.string().email() });

export async function inviteMember(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { session, orgId, membership } = await getContext();
    requirePermission(membership.role, "member:invite");

    const { email } = InviteSchema.parse({ email: formData.get("email") });

    const limitCheck = await checkOrgLimit(orgId, "seats");
    if (!limitCheck.allowed) {
      return {
        data: null,
        error: {
          code: "LIMIT_EXCEEDED",
          message: "Seat limit reached. Upgrade your plan to invite more members.",
        },
      };
    }

    const clerk = await clerkClient();
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

    // Create Clerk org invitation — this sends the Clerk-managed email link.
    await clerk.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: "org:member",
      inviterUserId: session.userId,
    });

    // Send our branded email alongside the Clerk invite.
    await sendEmail({
      to: email,
      subject: `You've been invited to ${org.name}`,
      react: InviteEmail({
        inviterName: membership.user.name ?? membership.user.email,
        orgName: org.name,
        acceptUrl: `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/sign-up`,
      }),
      text: inviteEmailText({
        inviterName: membership.user.name ?? membership.user.email,
        orgName: org.name,
        acceptUrl: `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/sign-up`,
      }),
    });

    writeAuditLog({
      orgId,
      userId: membership.userId,
      action: "member.invited",
      resource: "member",
      resourceId: email,
    });

    revalidatePath("/dashboard/team");
    return ok(null);
  } catch (e) {
    return fromError(e);
  }
}

// ── Change role ────────────────────────────────────────────────────────────────

const ChangeRoleSchema = z.object({
  memberId: z.string().cuid(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

export async function changeMemberRole(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { orgId, membership } = await getContext();
    requirePermission(membership.role, "member:role:update");

    const { memberId, role } = ChangeRoleSchema.parse({
      memberId: formData.get("memberId"),
      role: formData.get("role"),
    });

    const target = await prisma.organizationMembership.findUniqueOrThrow({
      where: { id: memberId, orgId },
    });

    // Prevent demoting the last owner.
    if (target.role === "OWNER" && role !== "OWNER") {
      const ownerCount = await prisma.organizationMembership.count({
        where: { orgId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return {
          data: null,
          error: { code: "LAST_OWNER", message: "Cannot change the role of the last owner." },
        };
      }
    }

    await prisma.organizationMembership.update({
      where: { id: memberId },
      data: { role: role as OrgRole },
    });

    writeAuditLog({
      orgId,
      userId: membership.userId,
      action: "member.role_changed",
      resource: "member",
      resourceId: memberId,
      metadata: { newRole: role },
    });

    revalidatePath("/dashboard/team");
    return ok(null);
  } catch (e) {
    return fromError(e);
  }
}

// ── Remove member ──────────────────────────────────────────────────────────────

const RemoveMemberSchema = z.object({ memberId: z.string().cuid() });

export async function removeMember(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { orgId, membership } = await getContext();
    requirePermission(membership.role, "member:remove");

    const { memberId } = RemoveMemberSchema.parse({ memberId: formData.get("memberId") });

    if (memberId === membership.id) {
      return { data: null, error: { code: "SELF_REMOVE", message: "You cannot remove yourself." } };
    }

    const target = await prisma.organizationMembership.findUniqueOrThrow({
      where: { id: memberId, orgId },
    });

    if (target.role === "OWNER") {
      const ownerCount = await prisma.organizationMembership.count({
        where: { orgId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return {
          data: null,
          error: { code: "LAST_OWNER", message: "Cannot remove the last owner." },
        };
      }
    }

    await prisma.organizationMembership.delete({ where: { id: memberId } });

    writeAuditLog({
      orgId,
      userId: membership.userId,
      action: "member.removed",
      resource: "member",
      resourceId: memberId,
    });

    revalidatePath("/dashboard/team");
    return ok(null);
  } catch (e) {
    return fromError(e);
  }
}
