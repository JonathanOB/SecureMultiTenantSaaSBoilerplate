// This module is server-only. Importing it in a client component will throw at build time.
import "server-only";

import { z } from "zod";

const envSchema = z.looseObject({
  // ── App ────────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().min(1),

  // ── Clerk ──────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // ── Supabase ───────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ── Database (Prisma) ──────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1), // bypasses pgBouncer for migrations

  // ── Stripe ─────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().min(1),
  STRIPE_PRO_YEARLY_PRICE_ID: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),

  // ── Upstash Redis ──────────────────────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // ── Resend ─────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1),

  // ── Sentry ─────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SENTRY_DSN: z.string().min(1),
  SENTRY_AUTH_TOKEN: z.string().optional(), // only required for source-map uploads

  // ── Storage ────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_STORAGE_URL: z.string().min(1),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => (issue.path.length > 0 ? String(issue.path[0]) : "unknown"))
      .join(", ");

    throw new Error(
      `Missing or invalid environment variables: ${missing}\n` +
        `Copy .env.local.example to .env.local and fill in all required values.`
    );
  }

  return result.data;
}

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
