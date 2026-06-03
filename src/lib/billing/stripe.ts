import "server-only";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/lib/audit/log";
import { appConfig } from "@/config/app.config";
import { AppError } from "@/lib/api/response";

// ── Singleton ──────────────────────────────────────────────────────────────────
// One Stripe client per process — reused across all server-side calls.

function createStripeClient(): Stripe {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new AppError("STRIPE_SECRET_KEY is not set.", "CONFIG_ERROR", 500);
  return new Stripe(key, { typescript: true });
}

const globalForStripe = globalThis as typeof globalThis & { stripe?: Stripe };
export const stripe: Stripe = globalForStripe.stripe ?? createStripeClient();
if (process.env["NODE_ENV"] !== "production") globalForStripe.stripe = stripe;

// ── Customer helpers ───────────────────────────────────────────────────────────

/** Retrieves the Stripe customer for the org, creating one if it doesn't exist. */
export async function getOrCreateStripeCustomer(orgId: string): Promise<string> {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });

  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    name: org.name,
    metadata: { orgId },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// ── Checkout ───────────────────────────────────────────────────────────────────

type CheckoutParams = {
  orgId: string;
  userId: string;
  priceId: string;
  returnUrl: string;
};

/** Creates a Stripe Checkout Session and returns the session URL. */
export async function createCheckoutSession({
  orgId,
  userId,
  priceId,
  returnUrl,
}: CheckoutParams): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(orgId);
  const appUrl = process.env["NEXT_PUBLIC_APP_URL"] ?? "";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: appConfig.billing.trialDays,
      metadata: { orgId },
    },
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard/billing`,
    metadata: { orgId },
  });

  if (!session.url) {
    throw new AppError("Stripe did not return a session URL.", "STRIPE_ERROR", 500);
  }

  writeAuditLog({
    orgId,
    userId,
    action: "billing.plan_changed",
    resource: "checkout_session",
    resourceId: session.id,
  });

  return session.url;
}

// ── Customer Portal ────────────────────────────────────────────────────────────

/** Creates a Stripe Billing Portal session and returns the URL. */
export async function createPortalSession(orgId: string, returnUrl: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(orgId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

// ── Invoice history ────────────────────────────────────────────────────────────

/** Returns the last 12 invoices for the org's Stripe customer. */
export async function getInvoices(orgId: string) {
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } });
  if (!org.stripeCustomerId) return [];

  const invoices = await stripe.invoices.list({
    customer: org.stripeCustomerId,
    limit: 12,
  });

  return invoices.data;
}
