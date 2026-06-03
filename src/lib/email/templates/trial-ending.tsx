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
const { primary, background, foreground, muted, border, accent } = appConfig.theme.colors;

export type TrialEndingEmailProps = {
  orgName: string;
  daysRemaining: number;
  upgradeUrl: string;
};

export function TrialEndingEmail({
  orgName,
  daysRemaining,
  upgradeUrl,
}: TrialEndingEmailProps): ReactElement {
  const urgencyColor = daysRemaining <= 1 ? appConfig.theme.colors.destructive : accent;

  return (
    <Html lang="en">
      <Head />
      <Preview>
        {`Your ${appConfig.name} trial ends in ${String(daysRemaining)} ${daysRemaining === 1 ? "day" : "days"}`}
      </Preview>
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
            <Text
              style={{
                backgroundColor: urgencyColor,
                color: "#ffffff",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "13px",
                fontWeight: 600,
                display: "inline-block",
                margin: "0 0 16px",
              }}
            >
              {daysRemaining} {daysRemaining === 1 ? "day" : "days"} left
            </Text>
            <Heading
              style={{ color: foreground, fontSize: "24px", fontWeight: 600, margin: "0 0 16px" }}
            >
              Your trial is ending soon
            </Heading>
            <Text
              style={{ color: foreground, fontSize: "16px", lineHeight: "24px", margin: "0 0 8px" }}
            >
              The {appConfig.name} trial for <strong>{orgName}</strong> ends in{" "}
              <strong>
                {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
              </strong>
              .
            </Text>
            <Text
              style={{
                color: foreground,
                fontSize: "16px",
                lineHeight: "24px",
                margin: "0 0 24px",
              }}
            >
              Upgrade now to keep access to all Pro features and avoid any disruption to your team.
            </Text>
            <Button
              href={upgradeUrl}
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
              Upgrade to Pro
            </Button>
            <Text style={{ color: "#6b7280", fontSize: "14px", marginTop: "24px" }}>
              Have questions about pricing? Reply to this email or visit{" "}
              <a href={`${BASE_URL}/pricing`} style={{ color: primary }}>
                {BASE_URL}/pricing
              </a>
            </Text>
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

export function trialEndingEmailText({
  orgName,
  daysRemaining,
  upgradeUrl,
}: TrialEndingEmailProps): string {
  return `Your ${appConfig.name} trial for ${orgName} ends in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}.

Upgrade to Pro to keep access to all features: ${upgradeUrl}

Questions about pricing? Visit ${BASE_URL}/pricing or reply to this email.

— ${appConfig.name} (${appConfig.email.support})
`;
}
