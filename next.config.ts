import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env["ANALYZE"] === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Stable in Next.js 16 — validates all next/link href values at build time
  typedRoutes: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  // Fallback security headers for static assets (middleware handles dynamic routes)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  ...(process.env["SENTRY_ORG"] ? { org: process.env["SENTRY_ORG"] } : {}),
  ...(process.env["SENTRY_PROJECT"] ? { project: process.env["SENTRY_PROJECT"] } : {}),
  ...(process.env["SENTRY_AUTH_TOKEN"] ? { authToken: process.env["SENTRY_AUTH_TOKEN"] } : {}),
  sourcemaps: { disable: process.env["NODE_ENV"] !== "production" },
  disableLogger: true,
  silent: process.env["NODE_ENV"] !== "production",
});
