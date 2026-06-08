"use client";

import { OrganizationSwitcher } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * Dashboard org switcher — after switching, refreshes the server data
 * so the dashboard layout re-fetches with the new org context.
 */
export function OrgSwitcher() {
  const router = useRouter();

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
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors max-w-[180px]",
        },
      }}
      // After the Clerk org switch, push to /dashboard so the layout re-runs.
      afterSelectPersonalUrl={() => {
        router.push("/dashboard");
        return "/dashboard";
      }}
    />
  );
}
