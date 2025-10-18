/**
 * @fileoverview Configuration management
 *
 * Loads, validates, and resolves configuration files and options.
 * Merges configurations and applies environment overrides.
 */

import { existsSync } from "fs";
import { isAbsolute, join, resolve } from "path";

import { type VisualTestingToolConfig } from "@visnap/protocol";
import { bundleRequire } from "bundle-require";
import merge from "lodash/merge.js";

import { validateConfig } from "./config-schema";

import {
  DEFAULT_SCREENSHOT_DIR,
  DEFAULT_CONCURRENCY,
  DEFAULT_COMPARISON_CORE,
  DEFAULT_THRESHOLD,
  DEFAULT_DIFF_COLOR,
} from "@/constants";
import { ConfigError } from "@/utils/error-handler";
import { log } from "@/utils/logger";

/**
 * Finds the configuration file path.
 * @param configPath - Optional explicit configuration file path
 * @returns Configuration file path or null if not found
 */
export const resolveConfigPath = (configPath?: string): string | null => {
  if (configPath) {
    const candidate = isAbsolute(configPath)
      ? configPath
      : resolve(process.cwd(), configPath);
    return existsSync(candidate) ? candidate : null;
  }
  const tsPath = join(process.cwd(), "visnap.config.ts");
  if (existsSync(tsPath)) return tsPath;
  const jsPath = join(process.cwd(), "visnap.config.js");
  if (existsSync(jsPath)) return jsPath;
  return null;
};

/**
 * Loads and validates a configuration file.
 * @param configPath - Optional path to configuration file
 * @returns Promise resolving to validated configuration or null if not found
 * @throws {ConfigError} If configuration validation fails
 */
export const loadConfigFile = async (
  configPath?: string
): Promise<VisualTestingToolConfig | null> => {
  const filepath = resolveConfigPath(configPath);
  if (!filepath) return null;
  const { mod } = await bundleRequire({ filepath });
  const config = (mod?.default ?? mod) as unknown;

  // Validate the loaded config
  try {
    return validateConfig(config) as VisualTestingToolConfig;
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Failed to validate config file: ${error}`);
  }
};

/**
 * Gets the screenshot directory path with default fallback.
 * @param screenshotDir - Optional screenshot directory path
 * @returns Screenshot directory path
 */
export const resolveScreenshotDir = (screenshotDir?: string): string => {
  return screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
};

/**
 * Applies environment variable overrides to configuration.
 * @param config - Base configuration object
 * @returns Configuration with environment overrides applied
 */
function applyEnvOverrides(
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

/**
 * Logs the effective configuration to the console.
 * @param config - The configuration to log
 */
export const logEffectiveConfig = (config: VisualTestingToolConfig): void => {
  // Use dynamic import to avoid circular dependency
  log.info("Effective configuration:");
  log.dim(`  Screenshot directory: ${config.screenshotDir}`);
  log.dim(
    `  Comparison core: ${config.comparison?.core ?? DEFAULT_COMPARISON_CORE}`
  );
  log.dim(
    `  Comparison threshold: ${config.comparison?.threshold ?? DEFAULT_THRESHOLD}`
  );
  log.dim(
    `  Max concurrency: ${config.runtime?.maxConcurrency ?? DEFAULT_CONCURRENCY}`
  );
  log.dim(`  Browser adapter: ${config.adapters.browser.name}`);
  log.dim(`  Test case adapter: ${config.adapters.testCase[0]?.name}`);
  if (config.viewport) {
    const viewportKeys = Object.keys(config.viewport);
    log.dim(
      `  Global viewports: ${viewportKeys.length} configured (${viewportKeys.join(", ")})`
    );
  }
};
