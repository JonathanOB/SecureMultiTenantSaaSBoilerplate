"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Show, SignInButton } from "@clerk/nextjs";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { appConfig } from "@/config/app.config";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href={"/" as Route} className="flex items-center gap-2">
          <Image
            src={appConfig.logo.light}
            alt={appConfig.name}
            width={120}
            height={32}
            className="block dark:hidden"
            priority
          />
          <Image
            src={appConfig.logo.dark}
            alt={appConfig.name}
            width={120}
            height={32}
            className="hidden dark:block"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {appConfig.nav.marketing.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <Button size="sm" render={<Link href={"/sign-up" as Route} />}>
              Get started
            </Button>
          </Show>
          <Show when="signed-in">
            <Button size="sm" render={<Link href={"/dashboard" as Route} />}>
              Dashboard
            </Button>
          </Show>

          {/* Mobile hamburger */}
          <button
            className="ml-1 rounded-md p-1.5 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-border bg-background border-t px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {appConfig.nav.marketing.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                className="text-sm font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
