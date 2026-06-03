import { Shield, Zap, Users, CreditCard, Code2, BarChart3 } from "lucide-react";
import { appConfig } from "@/config/app.config";

const FEATURES = [
  {
    icon: Shield,
    title: "Enterprise-grade security",
    description: "Row-level security, RBAC, audit logging, and CSP headers out of the box.",
  },
  {
    icon: Users,
    title: "Multi-tenant teams",
    description: "Org-scoped workspaces with invite flows, role management, and SSO via Clerk.",
  },
  {
    icon: CreditCard,
    title: "Stripe billing built in",
    description: "Subscriptions, trials, webhooks, and a customer portal — fully wired up.",
  },
  {
    icon: Zap,
    title: "Ship in minutes",
    description: `Everything from auth to storage is pre-configured. Fork ${appConfig.name} and focus on your product.`,
  },
  {
    icon: Code2,
    title: "Type-safe end to end",
    description: "Strict TypeScript, Zod validation, typed routes, and Prisma ORM throughout.",
  },
  {
    icon: BarChart3,
    title: "Observability ready",
    description: "Sentry error tracking, audit logs, and rate limiting wired to Upstash Redis.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="bg-muted/30 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to ship
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Stop rebuilding the same infrastructure for every project.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="border-border bg-background rounded-xl border p-6 shadow-sm"
              >
                <div
                  className="mb-4 inline-flex size-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${appConfig.theme.colors.primary}20` }}
                >
                  <Icon className="size-5" style={{ color: appConfig.theme.colors.primary }} />
                </div>
                <h3 className="text-foreground mb-2 font-semibold">{feat.title}</h3>
                <p className="text-muted-foreground text-sm">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
