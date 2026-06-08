import { type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma/client";
import { withRateLimit } from "@/lib/rate-limit/upstash";
import { writeAuditLog } from "@/lib/audit/log";
import {
  apiSuccess,
  apiError,
  jsonResponse,
  AppError,
  UnauthorizedError,
} from "@/lib/api/response";

// ── Request ID ─────────────────────────────────────────────────────────────────

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── API key authentication ─────────────────────────────────────────────────────

async function authenticateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header.");
  }

  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) throw new UnauthorizedError("Empty Bearer token.");

  const incomingHash = createHash("sha256").update(rawKey).digest();
  const keyPrefix = rawKey.slice(0, 8);

  // Find candidate by prefix, then compare hashes in constant time.
  const candidates = await prisma.apiKey.findMany({
    where: { prefix: keyPrefix, revokedAt: null },
    include: { org: true, user: true },
  });

  let matched: (typeof candidates)[0] | null = null;
  for (const candidate of candidates) {
    const storedHash = Buffer.from(candidate.keyHash, "hex");
    if (storedHash.length === incomingHash.length && timingSafeEqual(incomingHash, storedHash)) {
      matched = candidate;
      break;
    }
  }

  if (!matched) throw new UnauthorizedError("Invalid API key.");

  if (matched.expiresAt && matched.expiresAt < new Date()) {
    throw new UnauthorizedError("API key has expired.");
  }

  // Update lastUsedAt non-blockingly.
  void prisma.apiKey.update({
    where: { id: matched.id },
    data: { lastUsedAt: new Date() },
  });

  return { org: matched.org, user: matched.user, key: matched };
}

// ── Route handlers ─────────────────────────────────────────────────────────────

async function handler(request: NextRequest, context: unknown): Promise<Response> {
  const ctx = context as { params: Promise<{ route: string[] }> };
  const requestId = generateRequestId();

  try {
    const { org, user } = await authenticateApiKey(request);
    const { route } = await ctx.params;
    const path = "/" + (route ?? []).join("/");

    writeAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "api.request" as never,
      resource: path,
      request,
    });

    // ── GET /api/v1/me ───────────────────────────────────────────────────────
    if (path === "/me" && request.method === "GET") {
      return jsonResponse(
        apiSuccess(
          {
            user: { id: user.id, email: user.email, name: user.name },
            org: { id: org.id, name: org.name, slug: org.slug, plan: org.plan },
          },
          requestId
        )
      );
    }

    // ── GET /api/v1/org ──────────────────────────────────────────────────────
    if (path === "/org" && request.method === "GET") {
      return jsonResponse(
        apiSuccess(
          {
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            subscriptionStatus: org.subscriptionStatus,
          },
          requestId
        )
      );
    }

    // ── GET /api/v1/org/members ──────────────────────────────────────────────
    if (path === "/org/members" && request.method === "GET") {
      const members = await prisma.organizationMembership.findMany({
        where: { orgId: org.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      return jsonResponse(
        apiSuccess(
          members.map((m) => ({
            id: m.id,
            role: m.role,
            user: m.user,
            joinedAt: m.joinedAt,
          })),
          requestId
        )
      );
    }

    return jsonResponse(apiError("NOT_FOUND", "Route not found."), 404);
  } catch (e) {
    if (e instanceof AppError) {
      return jsonResponse(apiError(e.code, e.message), e.statusCode);
    }
    // Never expose internals.
    return jsonResponse(apiError("INTERNAL_ERROR", "An unexpected error occurred."), 500);
  }
}

// Apply rate limiting and export HTTP method handlers.
const rateLimited = withRateLimit("api")(handler);

export const GET = rateLimited;
export const POST = rateLimited;
export const PUT = rateLimited;
export const PATCH = rateLimited;
export const DELETE = rateLimited;
