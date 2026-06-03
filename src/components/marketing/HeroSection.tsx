import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app.config";

export function HeroSection() {
  return (
    <section className="bg-background relative overflow-hidden py-24 sm:py-32">
      {/* Gradient blob */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            background: `linear-gradient(to right, ${appConfig.theme.colors.primary}, ${appConfig.theme.colors.secondary})`,
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-6xl">
            {appConfig.tagline}
          </h1>
          <p className="text-muted-foreground mt-6 text-lg leading-8">{appConfig.description}</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" render={<Link href={"/sign-up" as Route} />}>
              Get started free
            </Button>
            <Button size="lg" variant="outline" render={<Link href={"/#features" as Route} />}>
              Learn more
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            {appConfig.billing.trialDays}-day free trial &middot; No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
