import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
import { appConfig } from "@/config/app.config";
import { AppError, apiError } from "@/lib/api/response";

// ── Types ──────────────────────────────────────────────────────────────────────

export type RateLimiterKey = "api" | "auth" | "upload";

// ── Client IP extraction ───────────────────────────────────────────────────────
// Trust only the first IP in x-forwarded-for (the true client behind any CDN).
// Vercel also sets x-real-ip which is authoritative when present.

export function getClientIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp?.trim()) return xRealIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    return first?.trim() ?? "unknown";
  }

  return "unknown";
}

// ── Lazy singleton limiter map ─────────────────────────────────────────────────
// Initialised on first use so missing env vars don't crash module load.

let _limiters: Record<RateLimiterKey, Ratelimit> | null = null;

function getLimiters(): Record<RateLimiterKey, Ratelimit> {
  if (_limiters) return _limiters;

  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];
  if (!url || !token) {
    throw new AppError(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.",
      "CONFIG_ERROR",
      500
    );
  }

  const redis = new Redis({ url, token });

  const { api, auth, upload } = appConfig.rateLimit;

  _limiters = {
    api: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(api.requests, `${api.windowSeconds} s`),
      prefix: "@saas/api",
    }),
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(auth.requests, `${auth.windowSeconds} s`),
      prefix: "@saas/auth",
    }),
    upload: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(upload.requests, `${upload.windowSeconds} s`),
      prefix: "@saas/upload",
    }),
  };

  return _limiters;
}

// ── Core check ─────────────────────────────────────────────────────────────────

type LimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

async function check(limiterKey: RateLimiterKey, identifier: string): Promise<LimitResult> {
  const { success, reset } = await getLimiters()[limiterKey].limit(identifier);
  if (success) return { allowed: true };
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
  };
}

// ── Route handler HOF ──────────────────────────────────────────────────────────
// Wraps a Next.js App Router route handler with rate limiting.
// Returns 429 with Retry-After header before the handler runs.

type AppRouteHandler<TContext = unknown> = (req: NextRequest, ctx: TContext) => Promise<Response>;

export function withRateLimit<TContext = unknown>(
  limiterKey: RateLimiterKey
): (handler: AppRouteHandler<TContext>) => AppRouteHandler<TContext> {
  return (handler) => async (req, ctx) => {
    try {
      const ip = getClientIp(req);
      const orgId = req.headers.get("x-org-id") ?? "";
      const key = orgId ? `${ip}:${orgId}` : ip;

      const result = await check(limiterKey, key);
      if (!result.allowed) {
        return new Response(JSON.stringify(apiError("RATE_LIMITED", "Too many requests.")), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfterSeconds),
          },
        });
      }
    } catch (e) {
      // Rate limit failures must never block the request — log and continue.
      console.error("[rate-limit] Check failed, allowing request:", e);
    }

    return handler(req, ctx);
  };
}

// ── Server action check ────────────────────────────────────────────────────────
// Call inside a server action; throws AppError on rate limit exceeded.

export async function checkRateLimit(
  limiterKey: RateLimiterKey,
  ip: string,
  orgId?: string
): Promise<void> {
  try {
    const key = orgId ? `${ip}:${orgId}` : ip;
    const result = await check(limiterKey, key);
    if (!result.allowed) {
      throw new AppError("Too many requests. Please try again later.", "RATE_LIMITED", 429);
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    // Upstash connectivity issues — allow through rather than block the action.
    console.error("[rate-limit] Server action check failed, allowing:", e);
  }
}

// ── Middleware short-circuit helper ────────────────────────────────────────────
// Returns a 429 Response if the IP is rate-limited, null otherwise.
// Designed for use in middleware BEFORE auth checks.

export async function middlewareRateLimit(req: NextRequest): Promise<Response | null> {
  try {
    const ip = getClientIp(req);
    const result = await check("auth", ip);
    if (!result.allowed) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
      });
    }
  } catch {
    // Never block a request due to rate-limit infrastructure failures.
  }
  return null;
}
