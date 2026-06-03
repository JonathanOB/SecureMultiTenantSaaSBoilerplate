"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";

/**
 * Organization switcher backed by Clerk.
 * Placed in the dashboard topbar; triggers a full page reload via router.refresh()
 * after an org switch so server components re-fetch with the new org context.
 */
export function OrgSelector() {
  return (
    <OrganizationSwitcher
      hidePersonal
      afterSelectOrganizationUrl="/dashboard"
      afterCreateOrganizationUrl="/dashboard"
      afterLeaveOrganizationUrl="/"
      appearance={{
        elements: {
          rootBox: "flex items-center",
          organizationSwitcherTrigger:
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors",
        },
      }}
    />
  );
}
