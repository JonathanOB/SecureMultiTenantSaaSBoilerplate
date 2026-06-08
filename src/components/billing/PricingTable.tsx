"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanBadge } from "./PlanBadge";
import { appConfig } from "@/config/app.config";
import { cn } from "@/lib/utils";

type BillingPeriod = "monthly" | "yearly";

type PricingTableProps = {
  currentPlanId: string;
  onUpgrade: (priceId: string, period: BillingPeriod) => Promise<void>;
};

export function PricingTable({ currentPlanId, onUpgrade }: PricingTableProps) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [isPending, startTransition] = useTransition();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  function handleUpgrade(priceId: string) {
    if (!priceId) return;
    setLoadingPriceId(priceId);
    startTransition(async () => {
      await onUpgrade(priceId, period);
      setLoadingPriceId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="flex items-center gap-3">
        <span className="text-foreground text-sm font-medium">Billing period:</span>
        <div className="border-border bg-muted/50 inline-flex items-center gap-2 rounded-full border p-1">
          {(["monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                period === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
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

      {/* Plans */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {appConfig.billing.plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          // Both `period` keys are the same bounded union — no injection risk.
          // eslint-disable-next-line security/detect-object-injection
          const priceId = plan.stripePriceId[period];
          // eslint-disable-next-line security/detect-object-injection
          const displayPrice = plan.price[period];
          const isLoading = loadingPriceId === priceId && isPending;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border p-6",
                plan.highlighted ? "border-primary bg-primary/5" : "border-border bg-background"
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-foreground font-semibold">{plan.name}</h3>
                {isCurrent && <PlanBadge planId={plan.id} />}
              </div>
              <p className="text-muted-foreground mb-4 text-sm">{plan.description}</p>
              <div className="text-foreground mb-4 text-2xl font-bold">
                ${displayPrice}
                {displayPrice > 0 && (
                  <span className="text-muted-foreground text-sm font-normal">
                    /{period === "monthly" ? "mo" : "yr"}
                  </span>
                )}
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-foreground flex items-center gap-2 text-sm">
                    <Check className="text-primary size-3.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? "default" : "outline"}
                disabled={isCurrent || !priceId || isLoading}
                onClick={() => handleUpgrade(priceId)}
                className="w-full"
              >
                {isCurrent
                  ? "Current plan"
                  : isLoading
                    ? "Redirecting…"
                    : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
