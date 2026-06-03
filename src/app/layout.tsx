import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { appConfig } from "@/config/app.config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: appConfig.seo.titleTemplate,
    default: appConfig.seo.defaultTitle,
  },
  description: appConfig.description,
  openGraph: {
    title: appConfig.seo.defaultTitle,
    description: appConfig.description,
    images: [appConfig.seo.defaultOgImage],
    siteName: appConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    creator: appConfig.seo.twitterHandle,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the nonce injected by middleware so it can be passed to inline scripts.
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <ClerkProvider>
      <html
        lang={appConfig.locale}
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          {/* Nonce is forwarded via a meta tag so client-side code can read it
              and apply it to any dynamically injected scripts. */}
          {nonce && <meta name="csp-nonce" content={nonce} />}
        </head>
        <body className="bg-background text-foreground flex min-h-full flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme={appConfig.theme.defaultMode}
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
