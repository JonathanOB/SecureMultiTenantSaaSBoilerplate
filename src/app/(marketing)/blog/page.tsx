import type { Metadata } from "next";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: "Blog",
  description: `Guides, updates, and insights from the ${appConfig.name} team.`,
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
      <h1 className="text-foreground text-3xl font-bold tracking-tight">Blog</h1>
      <p className="text-muted-foreground mt-4">
        Guides, updates, and insights from the {appConfig.name} team. Coming soon.
      </p>
    </div>
  );
}
