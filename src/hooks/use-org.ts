"use client";

import { use } from "react";
import { OrgContext } from "@/components/dashboard/OrgContext";
import type { OrgContextValue } from "@/components/dashboard/OrgContext";

/**
 * Returns the current org context.
 * Must be used inside <OrgProvider> — throws if called outside.
 */
export function useOrg(): OrgContextValue {
  const ctx = use(OrgContext);
  if (!ctx) {
    throw new Error("useOrg() must be called inside <OrgProvider>.");
  }
  return ctx;
}
