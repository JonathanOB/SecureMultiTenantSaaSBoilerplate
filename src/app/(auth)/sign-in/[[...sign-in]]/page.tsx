import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      fallbackRedirectUrl="/dashboard"
      appearance={{
        elements: {
          card: "shadow-md",
          headerTitle: `Sign in to ${appConfig.name}`,
        },
      }}
    />
  );
}
