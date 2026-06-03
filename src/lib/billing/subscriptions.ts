import "server-only";

import { prisma } from "@/lib/prisma/client";
import { appConfig } from "@/config/app.config";
import { PaymentRequiredError } from "@/lib/api/response";
import type { BillingPlan } from "@/config/app.config";

// ── Plan lookup ────────────────────────────────────────────────────────────────

/** Returns the plan config from appConfig by plan ID, or the free plan as fallback. */
export function getPlanById(planId: string): BillingPlan {
  const plan = appConfig.billing.plans.find((p) => p.id === planId);
  const freePlan = appConfig.billing.plans.find((p) => p.id === "free");
  return plan ?? freePlan ?? appConfig.billing.plans[0]!;
}

/** Returns the plan for the given Stripe price ID, or the free plan if not found. */
export function getPlanByPriceId(priceId: string): BillingPlan {
  const plan = appConfig.billing.plans.find(
    (p) => p.stripePriceId.monthly === priceId || p.stripePriceId.yearly === priceId
  );
  return plan ?? getPlanById("free");
}

// ── Active subscription guard ─────────────────────────────────────────────────

/**
 * Throws PaymentRequiredError if the org does not have an active or trialing subscription.
 * Use at the top of server actions that require a paid feature.
 * Skipped entirely when `appConfig.features.billing` is false.
 */
export async function requireActiveSubscription(orgId: string): Promise<void> {
  if (!appConfig.features.billing) return;

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

  const allowedStatuses = new Set(["active", "trialing"]);
  if (!org.subscriptionStatus || !allowedStatuses.has(org.subscriptionStatus)) {
    throw new PaymentRequiredError("An active subscription is required to use this feature.");
  }

  // Check trial expiry even when status is "trialing".
  if (org.subscriptionStatus === "trialing" && org.trialEndsAt && org.trialEndsAt < new Date()) {
    throw new PaymentRequiredError("Your trial has expired. Please upgrade to continue.");
  }
}

// ── Usage limit checks ─────────────────────────────────────────────────────────

type LimitableResource = "seats" | "projects" | "storageGb";

type LimitCheckResult = {
  allowed: boolean;
  current: number;
  limit: number;
};

/** Compares current org usage against the plan limit for the given resource. */
export async function checkOrgLimit(
  orgId: string,
  resource: LimitableResource
): Promise<LimitCheckResult> {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  const plan = getPlanById(org.plan);
  const limit = plan.limits[resource];

  let current = 0;

  switch (resource) {
    case "seats": {
      current = await prisma.organizationMembership.count({ where: { orgId } });
      break;
    }
    case "storageGb": {
      const result = await prisma.uploadedFile.aggregate({
        where: { orgId },
        _sum: { sizeBytes: true },
      });
      const totalBytes = result._sum.sizeBytes ?? 0;
      current = totalBytes / (1024 * 1024 * 1024);
      break;
    }
    case "projects": {
      // Placeholder: projects table is not in the current schema.
      // Replace with actual project count query when projects are added.
      current = 0;
      break;
    }
  }

  return { allowed: current < limit, current, limit };
}

// ── Subscription sync helper ───────────────────────────────────────────────────

type SubscriptionSyncData = {
  stripeSubscriptionId: string;
  stripePriceId: string;
  subscriptionStatus: string;
  currentPeriodEnd: Date;
  trialEndsAt?: Date | null;
};

/** Syncs Stripe subscription data to the Organization record. Called by the webhook handler. */
export async function syncSubscriptionToOrg(
  orgId: string,
  data: SubscriptionSyncData
): Promise<void> {
  const plan = getPlanByPriceId(data.stripePriceId);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripePriceId: data.stripePriceId,
      // Prisma's SubscriptionStatus enum values match Stripe's lowercase statuses.
      subscriptionStatus: data.subscriptionStatus as never,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt ?? null,
      plan: plan.id,
    },
  });
}
