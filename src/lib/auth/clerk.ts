import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma/client";
import { UnauthorizedError } from "@/lib/api/response";
import type { OrgRole } from "@/types";

// ── Auth object helpers ────────────────────────────────────────────────────────

/** Returns the current auth session or throws UnauthorizedError if not signed in. */
export async function requireAuth() {
  const session = await auth();
  if (!session.userId) throw new UnauthorizedError();
  return session;
}

/** Returns `orgId` from the active Clerk session or throws if missing. */
export async function requireOrgId(): Promise<string> {
  const session = await auth();
  if (!session.userId) throw new UnauthorizedError();
  if (!session.orgId) {
    throw new UnauthorizedError("No active organization selected.");
  }
  return session.orgId;
}

// ── User record helpers ────────────────────────────────────────────────────────

/** Returns the Clerk User object for the current session, or null if signed out. */
export async function getClerkUser() {
  return currentUser();
}

/**
 * Upserts the User record in our database from Clerk data.
 * Called by the Clerk webhook handler on user.created / user.updated.
 */
export async function upsertUserFromClerk(clerkUser: {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string;
}) {
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
      avatarUrl: clerkUser.imageUrl ?? null,
    },
    update: {
      email,
      name,
      avatarUrl: clerkUser.imageUrl ?? null,
    },
  });
}

/**
 * Updates lastLoginAt for the user associated with the given Clerk ID.
 * Called on session.created webhook.
 */
export async function updateLastLogin(clerkId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { clerkId },
    data: { lastLoginAt: new Date() },
  });
}

/**
 * Returns the internal DB User record for the currently signed-in Clerk user.
 * Throws UnauthorizedError if not signed in.
 */
export async function getCurrentDbUser() {
  const session = await auth();
  if (!session.userId) throw new UnauthorizedError();

  const user = await prisma.user.findUnique({
    where: { clerkId: session.userId },
  });

  if (!user) throw new UnauthorizedError("User record not found.");
  return user;
}

/**
 * Returns the membership record for the current user in the given org,
 * including their role. Throws if the user is not a member.
 */
export async function getCurrentMembership(orgId: string) {
  const session = await auth();
  if (!session.userId) throw new UnauthorizedError();

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      orgId,
      user: { clerkId: session.userId },
    },
    include: { org: true },
  });

  return membership;
}

/** Maps a Clerk organization role string to our internal OrgRole enum. */
export function mapClerkOrgRole(clerkRole: string): OrgRole {
  const map: Record<string, OrgRole> = {
    "org:admin": "ADMIN",
    "org:member": "MEMBER",
    admin: "ADMIN",
    member: "MEMBER",
    owner: "OWNER",
  };
  return map[clerkRole] ?? "VIEWER";
}
