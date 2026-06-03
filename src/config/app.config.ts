// THE MASTER CONFIG — single source of truth for every white-label concern.
// Change values here and the entire app rebrands automatically.
// Never hardcode colors, strings, logos, or feature flags anywhere else.

export const appConfig = {
  // ── Identity ──────────────────────────────────────────────────────────────
  name: "MySaaS",
  tagline: "The fastest way to ship your idea.",
  description: "A production-ready multi-tenant SaaS boilerplate.",
  url: "https://github.com/JonathanOB",
  locale: "en-US",

  // ── Branding ──────────────────────────────────────────────────────────────
  logo: {
    light: "/brand/logo-light.svg",
    dark: "/brand/logo-dark.svg",
    icon: "/brand/icon.svg",
  },
  favicon: {
    ico: "/favicons/favicon.ico",
    png16: "/favicons/favicon-16x16.png",
    png32: "/favicons/favicon-32x32.png",
    apple: "/favicons/apple-touch-icon.png",
    webmanifest: "/site.webmanifest",
  },

  // ── Theme / Design Tokens ─────────────────────────────────────────────────
  theme: {
    defaultMode: "light" as "light" | "dark" | "system",
    colors: {
      primary: "#6366F1",
      secondary: "#EC4899",
      accent: "#F59E0B",
      background: "#FFFFFF",
      foreground: "#09090B",
      muted: "#F4F4F5",
      border: "#E4E4E7",
      destructive: "#EF4444",
    },
    borderRadius: "0.75rem",
    fontSans: "var(--font-geist-sans)",
    fontMono: "var(--font-geist-mono)",
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    marketing: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Docs", href: "/docs" },
    ],
    dashboard: [
      { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
      { label: "Billing", href: "/dashboard/billing", icon: "CreditCard" },
      { label: "Team", href: "/dashboard/team", icon: "Users" },
      { label: "Audit Log", href: "/dashboard/audit-log", icon: "ClipboardList" },
      { label: "API Keys", href: "/dashboard/settings/api-keys", icon: "Key" },
    ],
    footerGroups: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "/#features" },
          { label: "Pricing", href: "/pricing" },
          { label: "Blog", href: "/blog" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
  },

  // ── Feature Flags ─────────────────────────────────────────────────────────
  features: {
    billing: true,
    teams: true,
    auditLog: true,
    apiKeys: true,
    magicLink: true,
    oauthGoogle: true,
    oauthGithub: true,
    darkMode: true,
    i18n: false,
    maintenanceMode: false,
  },

  // ── Billing / Stripe ──────────────────────────────────────────────────────
  billing: {
    currency: "usd",
    plans: [
      {
        id: "free",
        name: "Free",
        description: "Perfect for side projects.",
        price: { monthly: 0, yearly: 0 },
        stripePriceId: { monthly: "", yearly: "" },
        limits: { seats: 1, projects: 3, storageGb: 1 },
        features: ["3 projects", "1 GB storage", "Community support"],
        highlighted: false,
      },
      {
        id: "pro",
        name: "Pro",
        description: "For growing teams.",
        price: { monthly: 19, yearly: 190 },
        stripePriceId: {
          // These are read from env at server runtime; empty string on the client is intentional.
          monthly: process.env["STRIPE_PRO_MONTHLY_PRICE_ID"] ?? "",
          yearly: process.env["STRIPE_PRO_YEARLY_PRICE_ID"] ?? "",
        },
        limits: { seats: 5, projects: 20, storageGb: 20 },
        features: ["20 projects", "20 GB storage", "Priority support", "API access"],
        highlighted: true,
      },
    ],
    trialDays: 14,
  },

  // ── Email ─────────────────────────────────────────────────────────────────
  email: {
    from: "MySaaS <noreply@mysaas.com>",
    support: "support@mysaas.com",
    replyTo: "support@mysaas.com",
  },

  // ── SEO Defaults ──────────────────────────────────────────────────────────
  seo: {
    titleTemplate: "%s | MySaaS",
    defaultTitle: "MySaaS — Ship faster",
    defaultOgImage: "/og/default.png",
    twitterHandle: "@mysaas",
  },

  // ── Rate Limits ───────────────────────────────────────────────────────────
  rateLimit: {
    api: { requests: 100, windowSeconds: 60 },
    auth: { requests: 10, windowSeconds: 60 },
    upload: { requests: 20, windowSeconds: 60 },
  },

  // ── Storage ───────────────────────────────────────────────────────────────
  storage: {
    avatarBucket: "avatars",
    assetBucket: "assets",
    maxFileSizeMb: 10,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
  },
} as const;

// AppConfig is inferred from the object so type changes propagate automatically.
export type AppConfig = typeof appConfig;

// Convenience re-exports for the most-accessed sub-sections.
export type ThemeColors = AppConfig["theme"]["colors"];
export type BillingPlan = AppConfig["billing"]["plans"][number];
export type NavItem = AppConfig["nav"]["dashboard"][number];
export type FeatureFlags = AppConfig["features"];
