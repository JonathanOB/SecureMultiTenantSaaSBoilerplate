import type { Metadata } from "next";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Privacy Policy</h1>

      <div className="prose prose-neutral dark:prose-invert text-foreground max-w-none space-y-6">
        <p className="text-muted-foreground">
          Last updated:{" "}
          {new Date().toLocaleDateString(appConfig.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <section>
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground">
            {appConfig.name} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to
            protecting your personal information. This Privacy Policy explains how we collect, use,
            and share data when you use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <p className="text-muted-foreground">
            We collect information you provide directly (such as account details, billing
            information, and content you upload), as well as information collected automatically
            (such as usage data, IP addresses, and cookies).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p className="text-muted-foreground">
            We use your information to provide and improve our services, process payments, send
            transactional emails, and comply with legal obligations. We do not sell your personal
            data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Contact</h2>
          <p className="text-muted-foreground">
            Questions about this policy? Contact us at{" "}
            <a href={`mailto:${appConfig.email.support}`} className="text-primary underline">
              {appConfig.email.support}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
