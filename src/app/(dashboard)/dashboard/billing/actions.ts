"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { createCheckoutSession, createPortalSession } from "@/lib/billing/stripe";
import { fromError, ForbiddenError, UnauthorizedError } from "@/lib/api/response";
import type { ActionResult, OrgRole } from "@/types";

async function getContext() {
  const { userId } = await auth();
  if (!userId) throw new UnauthorizedError();

  const headerStore = await headers();
  const orgId = headerStore.get("x-org-id") ?? "";
  if (!orgId) throw new ForbiddenError("No active organization.");

  const membership = await prisma.organizationMembership.findFirst({
    where: { orgId, user: { clerkId: userId } },
  });
  if (!membership) throw new ForbiddenError("Not a member.");

  return { userId, orgId, role: membership.role as OrgRole, membershipId: membership.id };
}

export async function startCheckout(
  _prev: ActionResult<null>,
  formData: FormData
): Promise<ActionResult<null>> {
  try {
    const { userId, orgId, role } = await getContext();
    requirePermission(role, "billing:manage");

    const priceId = formData.get("priceId");
    if (typeof priceId !== "string" || !priceId) {
      return { data: null, error: { code: "INVALID_INPUT", message: "Invalid price." } };
    }

    const returnUrl = `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/dashboard/billing`;
    const url = await createCheckoutSession({ orgId, userId, priceId, returnUrl });

    redirect(url);
  } catch (e) {
    // redirect() throws — let it propagate.
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return fromError(e);
  }
}

/** Direct server action for PricingTable's onUpgrade prop (takes priceId string). */
export async function upgradeWithPriceId(priceId: string): Promise<void> {
  const { userId, orgId, role } = await getContext();
  requirePermission(role, "billing:manage");

  const returnUrl = `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/dashboard/billing`;
  const url = await createCheckoutSession({ orgId, userId, priceId, returnUrl });

  redirect(url);
}

export async function openPortal(_prev: ActionResult<null>): Promise<ActionResult<null>> {
  try {
    const { orgId, role } = await getContext();
    requirePermission(role, "billing:manage");

    const returnUrl = `${process.env["NEXT_PUBLIC_APP_URL"] ?? ""}/dashboard/billing`;
    const url = await createPortalSession(orgId, returnUrl);

    redirect(url);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return fromError(e);
  }
}
