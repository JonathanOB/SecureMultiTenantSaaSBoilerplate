import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactElement } from "react";
import { appConfig } from "@/config/app.config";

const BASE_URL = process.env["NEXT_PUBLIC_APP_URL"] ?? "";
const { primary, background, foreground, muted, border } = appConfig.theme.colors;

export type WelcomeEmailProps = {
  userName: string;
  orgName: string;
  dashboardUrl: string;
};

export function WelcomeEmail({ userName, orgName, dashboardUrl }: WelcomeEmailProps): ReactElement {
  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to {appConfig.name} — let&apos;s get you started</Preview>
      <Body style={{ backgroundColor: muted, fontFamily: "Inter, Arial, sans-serif", margin: 0 }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "40px auto",
            backgroundColor: background,
            borderRadius: appConfig.theme.borderRadius,
            border: `1px solid ${border}`,
            overflow: "hidden",
          }}
        >
          <Section style={{ padding: "32px 48px 0" }}>
            <Img src={`${BASE_URL}${appConfig.logo.light}`} alt={appConfig.name} height={32} />
          </Section>
          <Section style={{ padding: "32px 48px" }}>
            <Heading
              style={{ color: foreground, fontSize: "24px", fontWeight: 600, margin: "0 0 16px" }}
            >
              Welcome to {appConfig.name}, {userName}!
            </Heading>
            <Text
              style={{ color: foreground, fontSize: "16px", lineHeight: "24px", margin: "0 0 8px" }}
            >
              {appConfig.tagline}
            </Text>
            <Text
              style={{
                color: foreground,
                fontSize: "16px",
                lineHeight: "24px",
                margin: "0 0 24px",
              }}
            >
              Your workspace <strong>{orgName}</strong> is ready. You have{" "}
              {appConfig.billing.trialDays} days to explore all Pro features — no credit card
              required to start.
            </Text>
            <Button
              href={dashboardUrl}
              style={{
                backgroundColor: primary,
                color: "#ffffff",
                borderRadius: appConfig.theme.borderRadius,
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Go to Dashboard
            </Button>
          </Section>
          <Hr style={{ borderColor: border, margin: "0 48px" }} />
          <Section style={{ padding: "16px 48px" }}>
            <Text style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
              &copy; {new Date().getFullYear()} {appConfig.name} &mdash;{" "}
              <a href={`mailto:${appConfig.email.support}`} style={{ color: "#9ca3af" }}>
                {appConfig.email.support}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function welcomeEmailText({ userName, orgName, dashboardUrl }: WelcomeEmailProps): string {
  return `Welcome to ${appConfig.name}, ${userName}!

${appConfig.tagline}

Your workspace "${orgName}" is ready. You have ${appConfig.billing.trialDays} days to explore all Pro features.

Go to your dashboard: ${dashboardUrl}

Questions? Reply to this email or contact ${appConfig.email.support}

— The ${appConfig.name} Team
`;
}
