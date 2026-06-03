"use client";

import type { ComponentProps } from "react";
import { UserButton as ClerkUserButton } from "@clerk/nextjs";

type UserButtonProps = ComponentProps<typeof ClerkUserButton>;

/**
 * Thin wrapper around Clerk's UserButton with app-wide appearance defaults.
 * Spread props after the appearance default so callers can still override it.
 * Sign-out redirect is configured via CLERK_SIGN_OUT_URL env var.
 */
export function UserButton(props: UserButtonProps) {
  return <ClerkUserButton appearance={{ elements: { avatarBox: "size-8" } }} {...props} />;
}
