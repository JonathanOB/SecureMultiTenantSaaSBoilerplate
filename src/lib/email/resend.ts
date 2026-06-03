import "server-only";

import { Resend } from "resend";
import type { ReactElement } from "react";
import { appConfig } from "@/config/app.config";
import { AppError } from "@/lib/api/response";

// ── Singleton ──────────────────────────────────────────────────────────────────

function createResendClient(): Resend {
  const key = process.env["RESEND_API_KEY"];
  if (!key) throw new AppError("RESEND_API_KEY is not set.", "CONFIG_ERROR", 500);
  return new Resend(key);
}

const globalForResend = globalThis as typeof globalThis & { resend?: Resend };
export const resend: Resend = globalForResend.resend ?? createResendClient();
if (process.env["NODE_ENV"] !== "production") globalForResend.resend = resend;

// ── Send helper ────────────────────────────────────────────────────────────────

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  text: string;
  replyTo?: string;
};

type SendEmailResult = { id: string };

/**
 * Sends a transactional email via Resend.
 * `react` is the React Email component (rendered to HTML by Resend).
 * `text` is the plain-text fallback required by email RFCs.
 */
export async function sendEmail({
  to,
  subject,
  react,
  text,
  replyTo,
}: SendEmailParams): Promise<SendEmailResult> {
  const { data, error } = await resend.emails.send({
    from: appConfig.email.from,
    to,
    subject,
    react,
    text,
    replyTo: replyTo ?? appConfig.email.replyTo,
  });

  if (error ?? !data) {
    throw new AppError(
      `Failed to send email: ${(error as { message?: string } | null)?.message ?? "unknown"}`,
      "EMAIL_ERROR",
      500
    );
  }

  return { id: data.id };
}
