import { createContext } from "react";
import type { OrgRole, SubscriptionStatus } from "@/types";
import type { BillingPlan } from "@/config/app.config";

// Plain serializable types — safe to pass from Server Components to client context.
// Never import @prisma/client here.

export type OrgContextOrg = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: string;
  subscriptionStatus: SubscriptionStatus | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
};

export type OrgContextMembership = {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
};

export type OrgContextValue = {
  org: OrgContextOrg;
  membership: OrgContextMembership;
  currentPlan: BillingPlan;
  isLoading: boolean;
};

export const OrgContext = createContext<OrgContextValue | null>(null);
