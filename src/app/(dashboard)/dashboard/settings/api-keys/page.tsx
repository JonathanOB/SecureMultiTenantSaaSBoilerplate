import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { hasPermission } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateKeyForm, RevokeKeyButton } from "./ApiKeysClient";
import { appConfig } from "@/config/app.config";
import type { OrgRole } from "@/types";

export const metadata: Metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) redirect("/sign-in");

  const membership = await prisma.organizationMembership.findFirst({
    where: { orgId, user: { clerkId: userId } },
  });
  if (!membership) redirect("/sign-in");

  const role = membership.role as OrgRole;
  const canCreate = hasPermission(role, "apikey:create");
  const canRevoke = hasPermission(role, "apikey:revoke");

  const keys = await prisma.apiKey.findMany({
    where: { orgId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage programmatic access to your organization.</p>
        </div>
        {canCreate && <CreateKeyForm />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active keys ({keys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active API keys.</p>
          ) : (
            <div className="divide-border divide-y">
              {keys.map((key) => {
                const isExpired = key.expiresAt && key.expiresAt < new Date();
                return (
                  <div
                    key={key.id}
                    className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-sm font-medium">{key.name}</span>
                        {isExpired && (
                          <Badge variant="destructive" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground mt-0.5 flex flex-wrap gap-2 text-xs">
                        <span className="font-mono">{key.prefix}••••••••</span>
                        <span>Created by {key.user.name ?? key.user.email}</span>
                        {key.lastUsedAt && (
                          <span>
                            Last used{" "}
                            {new Date(key.lastUsedAt).toLocaleDateString(appConfig.locale)}
                          </span>
                        )}
                        {key.expiresAt && (
                          <span>
                            Expires {new Date(key.expiresAt).toLocaleDateString(appConfig.locale)}
                          </span>
                        )}
                        {key.scopes.length > 0 && <span>Scopes: {key.scopes.join(", ")}</span>}
                      </div>
                    </div>
                    {canRevoke && <RevokeKeyButton keyId={key.id} keyName={key.name} />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
