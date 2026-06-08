import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { OrgProvider } from "@/components/dashboard/OrgProvider";
import type { OrgContextOrg, OrgContextMembership } from "@/components/dashboard/OrgContext";
import type { SubscriptionStatus } from "@/types";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";

  if (!orgId) {
    // User is authed but has no active org — redirect to org creation.
    redirect("/sign-in");
  }

  const [org, membership] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.organizationMembership.findFirst({
      where: { orgId, user: { clerkId: userId } },
    }),
  ]);

  if (!org || !membership) redirect("/sign-in");

  const contextOrg: OrgContextOrg = {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl,
    plan: org.plan,
    subscriptionStatus: org.subscriptionStatus as SubscriptionStatus | null,
    trialEndsAt: org.trialEndsAt,
    currentPeriodEnd: org.currentPeriodEnd,
    createdAt: org.createdAt,
  };

  const contextMembership: OrgContextMembership = {
    id: membership.id,
    role: membership.role,
    orgId: membership.orgId,
    userId: membership.userId,
  };

  return (
    <OrgProvider org={contextOrg} membership={contextMembership}>
      <div className="bg-background flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </OrgProvider>
  );
}
