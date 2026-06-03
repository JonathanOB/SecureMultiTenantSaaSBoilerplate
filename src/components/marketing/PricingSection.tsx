"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { appConfig } from "@/config/app.config";

type BillingPeriod = "monthly" | "yearly";

export function PricingSection() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Start free. Upgrade when you&apos;re ready.
          </p>

          {/* Billing toggle */}
          <div className="border-border bg-muted/50 mt-8 inline-flex items-center gap-3 rounded-full border p-1">
            {(["monthly", "yearly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p === "yearly" ? "Yearly" : "Monthly"}
                {p === "yearly" && (
                  <Badge variant="secondary" className="text-xs">
                    Save 17%
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          {appConfig.billing.plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                plan.highlighted ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 right-0 left-0 flex justify-center">
                  <Badge
                    className="text-xs"
                    style={{ backgroundColor: appConfig.theme.colors.primary }}
                  >
                    Most popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-foreground text-lg font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-foreground text-4xl font-bold">${plan.price[period]}</span>
                  {plan.price[period] > 0 && (
                    <span className="text-muted-foreground text-sm">
                      /{period === "monthly" ? "mo" : "yr"}
                    </span>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="text-foreground flex items-center gap-2 text-sm">
                    <Check
                      className="size-4 shrink-0"
                      style={{ color: appConfig.theme.colors.primary }}
                    />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                render={<Link href={"/sign-up" as Route} />}
              >
                {plan.price[period] === 0
                  ? "Get started free"
                  : `Start ${appConfig.billing.trialDays}-day trial`}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
