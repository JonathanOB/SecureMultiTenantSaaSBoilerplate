import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { appConfig } from "@/config/app.config";

export function Footer() {
  return (
    <footer className="border-border bg-muted/30 border-t">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href={"/" as Route} className="inline-flex items-center gap-2">
              <Image
                src={appConfig.logo.light}
                alt={appConfig.name}
                width={100}
                height={28}
                className="block dark:hidden"
              />
              <Image
                src={appConfig.logo.dark}
                alt={appConfig.name}
                width={100}
                height={28}
                className="hidden dark:block"
              />
            </Link>
            <p className="text-muted-foreground mt-3 max-w-xs text-sm">{appConfig.tagline}</p>
          </div>

          {/* Link groups */}
          {appConfig.nav.footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-foreground mb-3 text-sm font-semibold">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href as Route}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-border text-muted-foreground mt-8 border-t pt-6 text-sm">
          &copy; {new Date().getFullYear()} {appConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
