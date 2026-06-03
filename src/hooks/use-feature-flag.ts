"use client";

import { appConfig } from "@/config/app.config";
import type { FeatureFlags } from "@/config/app.config";

/**
 * Returns whether a feature flag is enabled.
 * Reads directly from appConfig — no network call, no re-render.
 *
 * @example
 * const billingEnabled = useFeatureFlag("billing");
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
  // `flag` is constrained to keyof FeatureFlags (a known const), not user input.
  // eslint-disable-next-line security/detect-object-injection
  return appConfig.features[flag];
}
