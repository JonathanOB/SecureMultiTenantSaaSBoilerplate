import type { Metadata } from "next";
import { PricingSection } from "@/components/marketing/PricingSection";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Pricing",
  description: `Simple, transparent pricing for ${appConfig.name}. Start free and upgrade when you're ready.`,
};

export default function PricingPage() {
  return (
    <div className="py-8">
      <div className="mx-auto max-w-6xl px-4 pt-8 text-center sm:px-6">
        <p className="text-primary text-sm font-medium tracking-wide uppercase">Pricing</p>
        <h1 className="text-foreground mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
          Plans for every stage
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
          Start with the free plan and scale as you grow. No hidden fees.
        </p>
      </div>
      <PricingSection />
    </div>
  );
}
