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
const { background, foreground, muted, border, destructive } = appConfig.theme.colors;

export type PaymentFailedEmailProps = {
  orgName: string;
  updateUrl: string;
  invoiceAmountFormatted?: string;
};

export function PaymentFailedEmail({
  orgName,
  updateUrl,
  invoiceAmountFormatted,
}: PaymentFailedEmailProps): ReactElement {
  return (
    <Html lang="en">
      <Head />
      <Preview>Action required: payment failed for {orgName}</Preview>
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
              style={{ color: destructive, fontSize: "24px", fontWeight: 600, margin: "0 0 16px" }}
            >
              Payment failed
            </Heading>
            <Text
              style={{ color: foreground, fontSize: "16px", lineHeight: "24px", margin: "0 0 8px" }}
            >
              We were unable to process the payment for <strong>{orgName}</strong>
              {invoiceAmountFormatted ? ` (${invoiceAmountFormatted})` : ""}.
            </Text>
            <Text
              style={{
                color: foreground,
                fontSize: "16px",
                lineHeight: "24px",
                margin: "0 0 24px",
              }}
            >
              Please update your billing information to keep your {appConfig.name} subscription
              active. Your access will be restricted if payment remains overdue.
            </Text>
            <Button
              href={updateUrl}
              style={{
                backgroundColor: destructive,
                color: "#ffffff",
                borderRadius: appConfig.theme.borderRadius,
                padding: "12px 24px",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Update Payment Method
            </Button>
            <Text style={{ color: "#6b7280", fontSize: "14px", marginTop: "24px" }}>
              If you have already updated your payment details, you can ignore this email. Contact{" "}
              <a
                href={`mailto:${appConfig.email.support}`}
                style={{ color: appConfig.theme.colors.primary }}
              >
                {appConfig.email.support}
              </a>{" "}
              if you need help.
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

export function paymentFailedEmailText({
  orgName,
  updateUrl,
  invoiceAmountFormatted,
}: PaymentFailedEmailProps): string {
  return `Payment failed for ${orgName}${invoiceAmountFormatted ? ` (${invoiceAmountFormatted})` : ""}.

Please update your billing information to keep your ${appConfig.name} subscription active.

Update payment method: ${updateUrl}

Need help? Contact ${appConfig.email.support}

— ${appConfig.name}
`;
}
