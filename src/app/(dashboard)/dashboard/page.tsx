import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, CreditCard, HardDrive, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { getPlanById } from "@/lib/billing/subscriptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageBar } from "@/components/billing/UsageBar";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardPage() {
  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) redirect("/sign-in");

  const [org, memberCount, storageResult, recentLogs] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
    prisma.organizationMembership.count({ where: { orgId } }),
    prisma.uploadedFile.aggregate({
      where: { orgId },
      _sum: { sizeBytes: true },
    }),
    prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const plan = getPlanById(org.plan);
  const storageGb = (storageResult._sum.sizeBytes ?? 0) / 1024 ** 3;
  const storageDisplay = storageGb < 0.01 ? 0 : Math.round(storageGb * 100) / 100;

  const stats = [
    {
      label: "Active Members",
      value: memberCount,
      sub: `of ${plan.limits.seats} seats`,
      Icon: Users,
    },
    {
      label: "Current Plan",
      value: plan.name,
      sub: org.subscriptionStatus ?? "free tier",
      Icon: CreditCard,
      badge: org.plan,
    },
    {
      label: "Storage Used",
      value: `${storageDisplay} GB`,
      sub: `of ${plan.limits.storageGb} GB`,
      Icon: HardDrive,
    },
    {
      label: "API Keys",
      value: null,
      sub: "managed in Settings",
      Icon: Activity,
      async: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground">Welcome back, {org.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, Icon, badge }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-foreground text-2xl font-bold">{value ?? "—"}</span>
                {badge !== undefined && <PlanBadge planId={badge} />}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage bars */}
      {appConfig.features.billing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar label="Seats" current={memberCount} limit={plan.limits.seats} />
            <UsageBar
              label="Storage"
              current={storageDisplay}
              limit={plan.limits.storageGb}
              unit=" GB"
            />
          </CardContent>
        </Card>
      )}

      {/* Recent audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity yet.</p>
          ) : (
            <div className="divide-border divide-y">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="text-foreground font-medium">
                      {log.user.name ?? log.user.email}
                    </span>
                    <span className="text-muted-foreground ml-1.5">{log.action}</span>
                    {log.resource && (
                      <span className="text-muted-foreground ml-1">· {log.resource}</span>
                    )}
                  </div>
                  <time className="text-muted-foreground shrink-0 pl-4 text-xs">
                    {new Date(log.createdAt).toLocaleDateString(appConfig.locale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
