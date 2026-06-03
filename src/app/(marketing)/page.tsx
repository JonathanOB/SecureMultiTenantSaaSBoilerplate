import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/HeroSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { appConfig } from "@/config/app.config";

export const metadata: Metadata = {
  title: appConfig.seo.defaultTitle,
  description: appConfig.description,
  openGraph: {
    title: appConfig.seo.defaultTitle,
    description: appConfig.description,
    images: [{ url: appConfig.seo.defaultOgImage }],
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </>
  );
}
