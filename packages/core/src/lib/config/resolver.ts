/**
 * @fileoverview Configuration resolution and merging utilities
 */

import type { VisualTestingToolConfig } from "@visnap/protocol";
import merge from "lodash/merge.js";

import { validateConfig } from "../config-schema";

import { applyEnvOverrides } from "./env-overrides";
import { loadConfigFile } from "./loader";

import {
  DEFAULT_SCREENSHOT_DIR,
  DEFAULT_COMPARISON_CORE,
  DEFAULT_THRESHOLD,
  DEFAULT_DIFF_COLOR,
} from "@/constants";
import { ConfigError } from "@/utils/error-handler";

/**
 * Gets the screenshot directory path with default fallback.
 * @param screenshotDir - Optional screenshot directory path
 * @returns Screenshot directory path
 */
export const resolveScreenshotDir = (screenshotDir?: string): string => {
  return screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
};

/**
 * Builds the final configuration by combining file config, options, and CLI overrides.
 * @param options - Configuration options to merge
 * @param cliOptions - CLI options for filters and config path
 * @returns Promise resolving to the final effective configuration
 * @throws {ConfigError} If configuration file is not found or validation fails
 */
export const resolveEffectiveConfig = async (
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: {
    include?: string | string[];
    exclude?: string | string[];
    configPath?: string;
  }
): Promise<VisualTestingToolConfig> => {
  const configFile = await loadConfigFile(cliOptions?.configPath);
  if (!configFile) {
    throw new ConfigError("visnap.config not found");
  }
  const merged = merge({}, configFile, options);

  // Apply CLI option overrides if provided
  if (cliOptions && (cliOptions.include || cliOptions.exclude)) {
    // Override the test case adapter options with CLI options for all adapters
    for (const adapter of merged.adapters.testCase) {
      adapter.options = {
        ...adapter.options,
        include: cliOptions.include,
        exclude: cliOptions.exclude,
      } as Record<string, unknown>;
    }
  }

  const configWithEnv = applyEnvOverrides(merged);
  // ensure defaults
  configWithEnv.screenshotDir = resolveScreenshotDir(
    configWithEnv.screenshotDir
  );

  // Ensure comparison config has defaults
  if (!configWithEnv.comparison) {
    configWithEnv.comparison = {
      core: DEFAULT_COMPARISON_CORE,
      threshold: DEFAULT_THRESHOLD,
      diffColor: DEFAULT_DIFF_COLOR,
    };
  }

  // Validate the final merged config
  try {
    return validateConfig(configWithEnv) as VisualTestingToolConfig;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Failed to validate effective config: ${error}`);
  }
};
