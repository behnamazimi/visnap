/**
 * @fileoverview Environment variable override utilities
 */

import type { VisualTestingToolConfig } from "@visnap/protocol";

import {
  DEFAULT_COMPARISON_CORE,
  DEFAULT_THRESHOLD,
  DEFAULT_DIFF_COLOR,
} from "@/constants";

/**
 * Applies environment variable overrides to configuration.
 * @param config - Base configuration object
 * @returns Configuration with environment overrides applied
 */
export function applyEnvOverrides(
  config: VisualTestingToolConfig
): VisualTestingToolConfig {
  const updatedConfig = { ...config };
  if (process.env.VISNAP_SCREENSHOT_DIR) {
    updatedConfig.screenshotDir = process.env.VISNAP_SCREENSHOT_DIR;
  }

  // Handle comparison config overrides
  if (
    process.env.VISNAP_COMPARISON_CORE ||
    process.env.VISNAP_COMPARISON_THRESHOLD ||
    process.env.VISNAP_COMPARISON_DIFF_COLOR ||
    process.env.VISNAP_THRESHOLD
  ) {
    updatedConfig.comparison = {
      core:
        (process.env.VISNAP_COMPARISON_CORE as
          | "odiff"
          | "pixelmatch"
          | undefined) ??
        updatedConfig.comparison?.core ??
        DEFAULT_COMPARISON_CORE,
      threshold: updatedConfig.comparison?.threshold ?? DEFAULT_THRESHOLD,
      diffColor: updatedConfig.comparison?.diffColor ?? DEFAULT_DIFF_COLOR,
    };

    if (process.env.VISNAP_COMPARISON_THRESHOLD) {
      const thresholdValue = Number(process.env.VISNAP_COMPARISON_THRESHOLD);
      if (!Number.isNaN(thresholdValue))
        updatedConfig.comparison.threshold = thresholdValue;
    } else if (process.env.VISNAP_THRESHOLD) {
      // Backward compatibility for old VISNAP_THRESHOLD env var
      const thresholdValue = Number(process.env.VISNAP_THRESHOLD);
      if (!Number.isNaN(thresholdValue))
        updatedConfig.comparison.threshold = thresholdValue;
    }
    if (process.env.VISNAP_COMPARISON_DIFF_COLOR) {
      updatedConfig.comparison.diffColor =
        process.env.VISNAP_COMPARISON_DIFF_COLOR;
    }
  }

  return updatedConfig;
}
