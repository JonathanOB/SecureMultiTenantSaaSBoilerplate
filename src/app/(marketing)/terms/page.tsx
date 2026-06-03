import type { Metadata } from "next";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Terms of Service</h1>

      <div className="max-w-none space-y-6">
        <p className="text-muted-foreground">
          Last updated:{" "}
          {new Date().toLocaleDateString(appConfig.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <section>
          <h2 className="text-foreground text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground mt-2">
            By accessing or using {appConfig.name}, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-semibold">2. Use of Service</h2>
          <p className="text-muted-foreground mt-2">
            You agree to use {appConfig.name} only for lawful purposes and in accordance with these
            terms. You are responsible for maintaining the confidentiality of your account
            credentials.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-semibold">3. Billing</h2>
          <p className="text-muted-foreground mt-2">
            Paid plans are billed in advance. Subscriptions auto-renew unless cancelled before the
            renewal date. All fees are non-refundable except where required by law.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-semibold">4. Limitation of Liability</h2>
          <p className="text-muted-foreground mt-2">
            {appConfig.name} is provided &quot;as is&quot; without warranties of any kind. To the
            maximum extent permitted by law, we are not liable for indirect, incidental, or
            consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-foreground text-xl font-semibold">5. Contact</h2>
          <p className="text-muted-foreground mt-2">
            Questions? Reach us at{" "}
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
