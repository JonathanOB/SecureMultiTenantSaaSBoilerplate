import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { middlewareRateLimit } from "@/lib/rate-limit/upstash";

// ── Route matchers ─────────────────────────────────────────────────────────────

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/api/v1(.*)"]);

// ── Nonce generation ───────────────────────────────────────────────────────────
// A fresh cryptographic nonce is created per request and injected into the CSP
// and into the x-nonce request header so layouts can pass it to <Script> tags.

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

// ── Security headers ───────────────────────────────────────────────────────────

function buildSecurityHeaders(nonce: string, clerkPublishableKey: string): Record<string, string> {
  // Extract the Clerk frontend API host from the publishable key prefix.
  // pk_test_xxx → "clerk.accounts.dev"; pk_live_xxx → clerk's live domain
  const clerkDomain = clerkPublishableKey.startsWith("pk_live_")
    ? "clerk.your-domain.com"
    : "*.clerk.accounts.dev";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://${clerkDomain}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com",
    `connect-src 'self' https://api.clerk.com https://${clerkDomain} https://api.stripe.com wss://*.supabase.co`,
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    // COEP breaks Clerk's iframe-based flows in some configurations;
    // enable only if you have confirmed all third-party resources are CORP-aware.
    // "Cross-Origin-Embedder-Policy": "require-corp",
  };
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Rate limit check BEFORE auth — prevents brute-force on auth endpoints
  // and reduces load on Clerk's API from malicious actors.
  const rateLimitResponse = await middlewareRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const nonce = generateNonce();
  const clerkKey = process.env["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] ?? "";
  const securityHeaders = buildSecurityHeaders(nonce, clerkKey);

  // Protect dashboard and v1 API — Clerk auto-redirects unauthenticated users.
  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Inject orgId into a request header so server components/actions can read it
  // via headers() without calling auth() again (avoids extra round-trips).
  const session = await auth();
  const orgId = session.orgId ?? "";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-org-id", orgId);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Apply security headers to every response.
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  return response;
});

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
    // Always run on API routes (even when they look like static files).
    "/(api|trpc)(.*)",
  ],
};
