import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserButton } from "@/components/auth/UserButton";
import { OrgSwitcher } from "./OrgSwitcher";

export function Topbar() {
  return (
    <header className="border-border bg-background flex h-12 items-center justify-between border-b px-4 sm:px-6">
      {/* Left: org switcher */}
      <OrgSwitcher />

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
