import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma/client";

// ── Action catalogue ───────────────────────────────────────────────────────────

export type AuditAction =
  | "user.signin"
  | "user.signout"
  | "user.updated"
  | "user.deleted"
  | "org.created"
  | "org.updated"
  | "org.deleted"
  | "member.invited"
  | "member.joined"
  | "member.removed"
  | "member.role_changed"
  | "billing.plan_changed"
  | "billing.subscription_cancelled"
  | "billing.payment_failed"
  | "apikey.created"
  | "apikey.revoked"
  | "file.uploaded"
  | "file.deleted"
  | "settings.updated";

// ── IP extraction ──────────────────────────────────────────────────────────────

function extractIp(request: Request): string | null {
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp?.trim()) return xRealIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First entry in the chain is the original client; later entries are proxies.
    const first = forwarded.split(",")[0];
    return first?.trim() ?? null;
  }

  return null;
}

// ── Metadata sanitizer ────────────────────────────────────────────────────────
// Strips any key that might contain sensitive values before persisting.

const SENSITIVE_PATTERNS = ["password", "token", "secret", "key", "credential", "auth"];

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metadata)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_PATTERNS.some((p) => lower.includes(p))) continue;
    sanitized[k] = v;
  }
  return sanitized;
}

// ── Writer ─────────────────────────────────────────────────────────────────────

export type WriteAuditLogParams = {
  orgId: string;
  userId: string; // internal DB User.id (not Clerk ID)
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
};

async function persist(params: WriteAuditLogParams): Promise<void> {
  const { orgId, userId, action, resource, resourceId, metadata, request } = params;

  const ipAddress = request ? extractIp(request) : null;
  const userAgent = request?.headers.get("user-agent") ?? null;
  const sanitized = (metadata ? sanitizeMetadata(metadata) : {}) as Prisma.InputJsonValue;

  await prisma.auditLog.create({
    data: {
      orgId,
      userId,
      action,
      resource: resource ?? null,
      resourceId: resourceId ?? null,
      metadata: sanitized,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Write an audit log entry non-blockingly after the current response is sent.
 *
 * Uses Next.js `after()` so the DB write never adds latency to the response.
 * Errors are caught and reported — they never surface to callers.
 *
 * Usage: `writeAuditLog({ orgId, userId, action, ... });`  (no await needed)
 */
export function writeAuditLog(params: WriteAuditLogParams): void {
  after(async () => {
    try {
      await persist(params);
    } catch (e) {
      // Audit log failures must never break the main flow.
      // TODO(Stage 15): replace with Sentry.captureException(e)
      console.error("[audit] Failed to write audit log:", e);
    }
  });
}
