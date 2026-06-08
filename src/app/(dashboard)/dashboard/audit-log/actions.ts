"use server";

import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
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

  return { orgId, role: membership.role as OrgRole };
}

// ── CSV export ─────────────────────────────────────────────────────────────────

export async function exportAuditLogCsv(
  _prev: ActionResult<string>,
  _formData: FormData
): Promise<ActionResult<string>> {
  try {
    const { orgId, role } = await getContext();
    requirePermission(role, "auditlog:read");

    const logs = await prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5000,
      include: { user: { select: { name: true, email: true } } },
    });

    const header = "timestamp,actor,action,resource,resourceId,ipAddress";
    const rows = logs.map((l) => {
      const actor = l.user.name ?? l.user.email;
      const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
      return [
        l.createdAt.toISOString(),
        escape(actor),
        escape(l.action),
        escape(l.resource ?? ""),
        escape(l.resourceId ?? ""),
        escape(l.ipAddress ?? ""),
      ].join(",");
    });

    return ok([header, ...rows].join("\n"));
  } catch (e) {
    return fromError(e);
  }
}
