"use client";

import { useOrg } from "./use-org";
import type { BillingPlan } from "@/config/app.config";

type SubscriptionInfo = {
  plan: BillingPlan;
  isActive: boolean;
  isTrialing: boolean;
  isFree: boolean;
  /** Raw trial-end date — use computeDaysUntilTrialEnd() to derive display value. */
  trialEndsAt: Date | null;
};

/**
 * Returns the current org's subscription plan and status.
 * Must be used inside <OrgProvider>.
 *
 * Tip: call computeDaysUntilTrialEnd(trialEndsAt) at render time to get the
 * remaining days — keep Date.now() out of hook bodies to satisfy purity rules.
 */
export function useSubscription(): SubscriptionInfo {
  const { org, currentPlan } = useOrg();

  const status = org.subscriptionStatus;

  return {
    plan: currentPlan,
    isActive: status === "active",
    isTrialing: status === "trialing",
    isFree: currentPlan.id === "free",
    trialEndsAt: org.trialEndsAt,
  };
}

/**
 * Pure helper — call at render time (not inside hooks) to convert a trial-end
 * date to a display-friendly day count.
 */
export function computeDaysUntilTrialEnd(trialEndsAt: Date | null): number | null {
  if (!trialEndsAt) return null;
  const ms = trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
