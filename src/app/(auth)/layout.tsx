import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { appConfig } from "@/config/app.config";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/30 flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Link href={"/" as Route} className="mb-8">
        <Image
          src={appConfig.logo.light}
          alt={appConfig.name}
          width={120}
          height={32}
          className="block dark:hidden"
          priority
        />
        <Image
          src={appConfig.logo.dark}
          alt={appConfig.name}
          width={120}
          height={32}
          className="hidden dark:block"
          priority
        />
      </Link>
      {children}
    </div>
  );
}
