# MySaaS — Production-Ready Multi-Tenant SaaS Boilerplate

A secure, white-label SaaS starter built on Next.js 15, TypeScript, Clerk, Supabase, Stripe, and Upstash Redis. Change one file (`config/app.config.ts`) to completely rebrand the app.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                      Next.js 15 (App Router)                    │
│                                                                 │
│  middleware.ts ──► Rate-limit (Upstash) ──► Clerk auth check    │
│       │                                                         │
│       ├── (marketing)/   Landing, Pricing, Blog, Legal          │
│       ├── (auth)/        Sign-in, Sign-up (Clerk-hosted UI)     │
│       ├── (dashboard)/   Protected: Sidebar + Topbar shell      │
│       │     ├── /dashboard         Overview + stats             │
│       │     ├── /dashboard/team    Member management            │
│       │     ├── /dashboard/billing Stripe checkout + portal     │
│       │     ├── /dashboard/settings Org settings + danger zone  │
│       │     ├── /dashboard/audit-log Paginated audit trail      │
│       │     └── /dashboard/settings/api-keys CRUD API keys      │
│       └── /api/
│             ├── /auth              Clerk webhook handler         │
│             ├── /billing           Stripe webhook handler        │
│             ├── /upload            Signed URL generation         │
│             └── /v1/[...route]     Public API (Bearer token)     │
└────────┬────────────────────┬──────────────────────────────────-┘
         │                    │
┌────────▼──────┐    ┌────────▼────────────────────────┐
│  Clerk (Auth) │    │  Supabase (Postgres + Storage)   │
│  - Sessions   │    │  - Prisma ORM                   │
│  - Orgs       │    │  - Row-Level Security (RLS)      │
│  - Webhooks   │    │  - File/image hosting            │
└───────────────┘    └─────────────────────────────────┘
         │                    │
┌────────▼──────┐    ┌────────▼────────────┐
│  Stripe       │    │  Upstash Redis       │
│  - Checkout   │    │  - Sliding-window    │
│  - Portal     │    │    rate limiting     │
│  - Webhooks   │    └─────────────────────┘
└───────────────┘
         │
┌────────▼──────┐    ┌─────────────────────┐
│  Resend       │    │  Sentry              │
│  - Invite     │    │  - Error monitoring  │
│  - Welcome    │    │  - Source maps       │
│  - Trial end  │    └─────────────────────┘
│  - Pay failed │
└───────────────┘
```

---

## Quick Setup

```bash
# 1. Clone and install
git clone <repo-url> my-saas && cd my-saas
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Fill in all values (see .env.local.example for guidance)

# 3. Set up the database
npm run db:push          # push schema to Supabase
npm run db:generate      # generate Prisma client + Supabase types

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Rebrand in Under 5 Minutes

Open `config/app.config.ts` and update the values at the top:

```ts
export const appConfig = {
  name: "YourApp",           // ← app name (used everywhere)
  tagline: "Your tagline.",
  url: "https://yourapp.com",
  theme: {
    colors: {
      primary: "#6366F1",    // ← brand color
      ...
    },
  },
  ...
}
```

Then regenerate CSS variables:

```bash
npm run generate:theme
```

That's it. Every page, email template, and component picks up the change automatically.

---

## Adding a New Stripe Plan

1. Create the plan in the Stripe dashboard and copy the price IDs.
2. Add the plan to `appConfig.billing.plans` in `config/app.config.ts`:
   ```ts
   {
     id: "enterprise",
     name: "Enterprise",
     description: "...",
     price: { monthly: 99, yearly: 990 },
     stripePriceId: {
       monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? "",
       yearly:  process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID  ?? "",
     },
     limits: { seats: 50, projects: 500, storageGb: 200 },
     features: [...],
     highlighted: false,
   }
   ```
3. Add the env vars to `.env.local` and your hosting platform.
4. The pricing table, billing page, and checkout flow pick up the new plan automatically.

---

## Adding a New RBAC Permission

1. Add the permission string to the `Permission` union in `lib/auth/permissions.ts`:
   ```ts
   export type Permission = ... | "project:create";
   ```
2. Add it to the relevant roles in `ROLE_PERMISSIONS`.
3. Use `requirePermission(role, "project:create")` in server actions, or `<PermissionGate permission="project:create">` in UI.

---

## Key Scripts

| Command                  | Description                                 |
| ------------------------ | ------------------------------------------- |
| `npm run dev`            | Start development server                    |
| `npm run build`          | Production build                            |
| `npm run lint`           | ESLint + TypeScript type check              |
| `npm run test`           | Vitest unit tests                           |
| `npm run test:e2e`       | Playwright end-to-end tests                 |
| `npm run db:migrate`     | Run Prisma migrations                       |
| `npm run db:studio`      | Open Prisma Studio                          |
| `npm run db:generate`    | Regenerate Prisma client + Supabase types   |
| `npm run generate:theme` | Regenerate CSS variables from appConfig     |
| `npm run email:preview`  | Preview email templates locally             |
| `npm run check:audit`    | npm audit for high-severity vulnerabilities |

---

## Security Highlights

- **CSP with per-request nonce** — every response gets a fresh `Content-Security-Policy` header with a cryptographically random nonce. No inline scripts execute without it.
- **Rate limiting** — Upstash sliding-window limiter on all API routes, auth flows, and uploads. Configurable in `appConfig.rateLimit`.
- **API key authentication** — keys are SHA-256 hashed before storage; comparison uses `crypto.timingSafeEqual` to prevent timing attacks. The plaintext key is shown exactly once.
- **Row-Level Security** — every tenant-scoped Supabase table has RLS policies that restrict access by `orgId` JWT claim. See `prisma/migrations/rls_policies.sql`.
- **RBAC** — four roles (OWNER, ADMIN, MEMBER, VIEWER) with a granular permissions matrix. Enforced in both server actions and UI.
- **Webhook verification** — Stripe webhooks use `stripe.webhooks.constructEvent`; Clerk webhooks use `svix` signature verification.
- **Audit log** — all mutations write a non-blocking audit record. Sensitive keys are stripped from metadata before persistence.
- **Secrets** — all environment variables are validated at startup via a Zod schema in `lib/env.ts`. Missing secrets crash with a clear error message.
- **No `any`** — TypeScript strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)/       Public-facing pages
│   ├── (auth)/            Clerk-powered auth pages
│   ├── (dashboard)/       Protected dashboard shell + pages
│   └── api/               Upload, webhooks, public API v1
├── components/
│   ├── ui/                shadcn/ui primitives
│   ├── marketing/         Landing page sections, Navbar, Footer
│   ├── dashboard/         Sidebar, Topbar, OrgProvider
│   ├── billing/           PricingTable, PlanBadge, UsageBar
│   ├── auth/              UserButton, auth wrappers
│   └── shared/            ThemeToggle, ImageUpload, ConfirmDialog
├── config/
│   └── app.config.ts      THE master config (rebrand here)
├── lib/
│   ├── auth/              Clerk helpers + RBAC permissions
│   ├── billing/           Stripe singleton + subscription guards
│   ├── email/             Resend client + React Email templates
│   ├── rate-limit/        Upstash sliding-window limiter
│   ├── storage/           Supabase Storage helpers + validation
│   ├── audit/             Non-blocking audit log writer
│   └── api/               Typed response helpers + error classes
├── hooks/                 useOrg, useSubscription, useFeatureFlag
└── types/                 Prisma enum mirrors + shared types
```
