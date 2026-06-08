"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  CreditCard,
  Users,
  ClipboardList,
  Key,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";
import { appConfig } from "@/config/app.config";
import { cn } from "@/lib/utils";

// Map icon name strings from appConfig to Lucide components.
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Settings,
  CreditCard,
  Users,
  ClipboardList,
  Key,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-background hidden w-56 shrink-0 border-r md:flex md:flex-col">
      <nav className="flex flex-1 flex-col gap-1 p-3 pt-4">
        {appConfig.nav.dashboard.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;
          const isActive =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* App name at bottom */}
      <div className="border-border border-t p-3">
        <p className="text-muted-foreground text-xs font-semibold">{appConfig.name}</p>
      </div>
    </aside>
  );
}
