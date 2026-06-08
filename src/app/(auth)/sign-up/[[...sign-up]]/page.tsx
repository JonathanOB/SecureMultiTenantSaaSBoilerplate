import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      fallbackRedirectUrl="/dashboard"
      appearance={{
        elements: {
          card: "shadow-md",
          headerTitle: `Create your ${appConfig.name} account`,
        },
      }}
    />
  );
}
