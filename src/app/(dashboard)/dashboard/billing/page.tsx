import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { getInvoices } from "@/lib/billing/stripe";
import { getPlanById } from "@/lib/billing/subscriptions";
import { hasPermission } from "@/lib/auth/permissions";
import { computeDaysUntilTrialEnd } from "@/hooks/use-subscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanBadge } from "@/components/billing/PlanBadge";
import { PricingTable } from "@/components/billing/PricingTable";
import { BillingClient } from "./BillingClient";
import { upgradeWithPriceId } from "./actions";
import { appConfig } from "@/config/app.config";
import type { OrgRole } from "@/types";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) redirect("/sign-in");

  const [org, membership, invoices] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: orgId } }),
    prisma.organizationMembership.findFirst({
      where: { orgId, user: { clerkId: userId } },
    }),
    getInvoices(orgId),
  ]);

  if (!membership) redirect("/sign-in");

  const role = membership.role as OrgRole;
  const canManage = hasPermission(role, "billing:manage");
  const plan = getPlanById(org.plan);
  const trialDaysLeft = computeDaysUntilTrialEnd(org.trialEndsAt);
  const isTrialing = org.subscriptionStatus === "trialing";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-foreground text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment details.</p>
      </div>

      {/* Trial banner */}
      {isTrialing && trialDaysLeft !== null && (
        <div className="border-accent/50 bg-accent/10 text-foreground rounded-lg border px-4 py-3 text-sm">
          <strong>Trial ending soon —</strong> {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""}{" "}
          remaining. Upgrade to keep access.
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current plan</CardTitle>
          <CardDescription>You are on the {plan.name} plan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PlanBadge planId={org.plan} />
            <span className="text-muted-foreground text-sm">
              {org.subscriptionStatus ? `Status: ${org.subscriptionStatus}` : "Free tier"}
            </span>
            {org.currentPeriodEnd && (
              <span className="text-muted-foreground text-sm">
                · renews {new Date(org.currentPeriodEnd).toLocaleDateString(appConfig.locale)}
              </span>
            )}
          </div>
          {canManage && org.stripeCustomerId && <BillingClient />}
        </CardContent>
      </Card>

      {/* Pricing table */}
      {appConfig.features.billing && canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change plan</CardTitle>
          </CardHeader>
          <CardContent>
            <PricingTable currentPlanId={org.plan} onUpgrade={upgradeWithPriceId} />
          </CardContent>
        </Card>
      )}

      {/* Invoice history */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice history</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-border divide-y">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <span className="text-foreground font-medium">
                      {inv.created
                        ? new Date(inv.created * 1000).toLocaleDateString(appConfig.locale, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                    <span className="text-muted-foreground ml-2 capitalize">{inv.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-medium">
                      {inv.currency?.toUpperCase()} {((inv.amount_paid ?? 0) / 100).toFixed(2)}
                    </span>
                    {inv.hosted_invoice_url && (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary text-xs underline-offset-4 hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
