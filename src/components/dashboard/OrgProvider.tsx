"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { OrgContext } from "./OrgContext";
import type { OrgContextOrg, OrgContextMembership } from "./OrgContext";
import { getPlanById } from "@/lib/billing/subscriptions";

type OrgProviderProps = {
  org: OrgContextOrg;
  membership: OrgContextMembership;
  children: ReactNode;
};

/**
 * Provides org, membership, and subscription data to all dashboard client components.
 * Receives server-fetched data as props — no client-side fetching required.
 */
export function OrgProvider({ org, membership, children }: OrgProviderProps) {
  const router = useRouter();
  const currentPlan = getPlanById(org.plan);

  // When Clerk fires an active-organization change (org switcher), re-fetch
  // the page so server components pick up the new org context.
  useOrganization({
    onMembershipChange: () => {
      router.refresh();
    },
  } as Parameters<typeof useOrganization>[0]);

  return (
    <OrgContext.Provider value={{ org, membership, currentPlan, isLoading: false }}>
      {children}
    </OrgContext.Provider>
  );
}
