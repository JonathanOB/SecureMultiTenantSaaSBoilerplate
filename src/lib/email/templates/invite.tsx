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

export type InviteEmailProps = {
  inviterName: string;
  orgName: string;
  acceptUrl: string;
  expiresInDays?: number;
};

export function InviteEmail({
  inviterName,
  orgName,
  acceptUrl,
  expiresInDays = 7,
}: InviteEmailProps): ReactElement {
  return (
    <Html lang="en">
      <Head />
      <Preview>
        {inviterName} invited you to join {orgName} on {appConfig.name}
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
            <Heading
              style={{ color: foreground, fontSize: "24px", fontWeight: 600, margin: "0 0 16px" }}
            >
              You&apos;ve been invited to {orgName}
            </Heading>
            <Text
              style={{
                color: foreground,
                fontSize: "16px",
                lineHeight: "24px",
                margin: "0 0 24px",
              }}
            >
              <strong>{inviterName}</strong> has invited you to collaborate on{" "}
              <strong>{orgName}</strong> using {appConfig.name}.
            </Text>
            <Button
              href={acceptUrl}
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
              Accept Invitation
            </Button>
            <Text style={{ color: "#6b7280", fontSize: "14px", marginTop: "24px" }}>
              This invitation expires in {expiresInDays} days. If you weren&apos;t expecting an
              invitation, you can safely ignore this email.
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

export function inviteEmailText({
  inviterName,
  orgName,
  acceptUrl,
  expiresInDays = 7,
}: InviteEmailProps): string {
  return `${inviterName} invited you to join ${orgName} on ${appConfig.name}.

Accept invitation: ${acceptUrl}

This invitation expires in ${expiresInDays} days.

If you weren't expecting this, please ignore this email.

— ${appConfig.name} (${appConfig.email.support})
`;
}
