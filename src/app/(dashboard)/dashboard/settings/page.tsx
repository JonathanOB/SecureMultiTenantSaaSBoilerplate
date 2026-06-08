import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { hasPermission } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm, DangerZone } from "./SettingsClient";
import type { OrgRole } from "@/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) redirect("/sign-in");

  const [org, membership] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
    prisma.organizationMembership.findFirst({
      where: { orgId, user: { clerkId: userId } },
    }),
  ]);

  if (!membership) redirect("/sign-in");

  const role = membership.role as OrgRole;
  const canUpdate = hasPermission(role, "org:update");
  const canDelete = hasPermission(role, "org:delete");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>Update your organization name, slug, and branding.</CardDescription>
        </CardHeader>
        <CardContent>
          {canUpdate ? (
            <OrgSettingsForm orgName={org.name} orgSlug={org.slug} orgLogoUrl={org.logoUrl} />
          ) : (
            <div className="space-y-3">
              <p className="text-foreground text-sm font-medium">{org.name}</p>
              <p className="text-muted-foreground text-sm">/{org.slug}</p>
              <p className="text-muted-foreground text-xs">
                You do not have permission to edit these settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {canDelete && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive text-base">Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <DangerZone orgName={org.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
