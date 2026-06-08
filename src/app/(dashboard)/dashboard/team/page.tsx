import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { hasPermission } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm, MemberList } from "./TeamClient";
import type { OrgRole } from "@/types";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) redirect("/sign-in");

  const [members, currentMembership] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { orgId },
      include: { user: { select: { name: true, email: true, avatarUrl: true } } },
      orderBy: { invitedAt: "asc" },
    }),
    prisma.organizationMembership.findFirst({
      where: { orgId, user: { clerkId: userId } },
    }),
  ]);

  if (!currentMembership) redirect("/sign-in");

  const role = currentMembership.role as OrgRole;
  const canInvite = hasPermission(role, "member:invite");
  const canChangeRole = hasPermission(role, "member:role:update");
  const canRemove = hasPermission(role, "member:remove");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground">Manage your organization members and permissions.</p>
      </div>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite member</CardTitle>
            <CardDescription>Add someone to your organization by email.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm canInvite={canInvite} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberList
            members={members.map((m) => ({ id: m.id, role: m.role as OrgRole, user: m.user }))}
            currentMemberId={currentMembership.id}
            canChangeRole={canChangeRole}
            canRemove={canRemove}
          />
        </CardContent>
      </Card>
    </div>
  );
}
