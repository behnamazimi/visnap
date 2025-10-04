import { existsSync } from "fs";
import { join } from "path";

import { bundleRequire } from "bundle-require";

import {
  DEFAULT_BROWSER,
  DEFAULT_CONCURRENCY,
  DEFAULT_SCREENSHOT_DIR,
} from "../constants";
import { parseIncludeExclude } from "../utils/args";
import { ConfigError, getErrorMessage } from "../utils/error-handler";
import {
  validateConcurrency,
  validateThreshold,
  validateScreenshotTarget,
  validateStorybookSource,
  validatePatterns,
} from "../utils/validation";

export type BrowserName = "chromium" | "firefox" | "webkit";

export interface VTTConfig {
  storybook: {
    /** Single source: URL (http/https) or local path to built storybook directory (e.g. ./storybook-static) */
    source: string;
    /** The element to screenshot. Defaults to "story-root" ("#storybook-root"). Can be a custom selector (e.g. ".my-custom-element"). */
    screenshotTarget: "story-root" | "body" | string;
  };
  /** Directory name for storing screenshots. Default: "visual-testing-tool" */
  screenshotDir?: string;
  /** Global pixel diff threshold for comparisons (0..1). Default: 0.1 */
  threshold?: number;
  /** One or more browsers to run tests in. Default: "chromium" */
  browser?: BrowserName | BrowserName[];
  /** Max number of stories to process concurrently per browser. Default: 2 */
  concurrency?: number;
  /** Dry run - don't take screenshots (CLI-specific) */
  dryRun?: boolean;
  /** Output JSON report to file (CLI-specific) */
  jsonReport?: string | boolean;
  /** Use Docker for execution (CLI-specific) */
  useDocker?: boolean;
  /** Include patterns for stories (convenience property) */
  include?: string | string[];
  /** Exclude patterns for stories (convenience property) */
  exclude?: string | string[];
}

export const getConfigTsPath = (): string =>
  join(process.cwd(), "vtt.config.ts");

export const configFileExists = (): boolean => existsSync(getConfigTsPath());

export const loadConfigFile = async (): Promise<VTTConfig | null> => {
  const tsPath = getConfigTsPath();
  if (!existsSync(tsPath)) return null;

  try {
    const { mod } = await bundleRequire({ filepath: tsPath });
    const config = (mod?.default ?? mod) as unknown;

    if (!config) return null;

    // Validate the loaded config
    const validatedConfig = config as VTTConfig;
    validateStorybookSource(validatedConfig.storybook.source);
    validateScreenshotTarget(validatedConfig.storybook.screenshotTarget);

    if (validatedConfig.threshold !== undefined) {
      validateThreshold(validatedConfig.threshold);
    }

    if (validatedConfig.concurrency !== undefined) {
      validateConcurrency(validatedConfig.concurrency);
    }

    if (validatedConfig.include) {
      validatedConfig.include = validatePatterns(validatedConfig.include);
    }

    if (validatedConfig.exclude) {
      validatedConfig.exclude = validatePatterns(validatedConfig.exclude);
    }

    return validatedConfig;
  } catch (error) {
    throw new ConfigError(
      `Failed to load config file: ${getErrorMessage(error)}`,
      error instanceof Error ? error : undefined
    );
  }
};

export const resolveBrowsers = (config?: VTTConfig): BrowserName[] => {
  const browser = config?.browser;
  if (!browser) return [DEFAULT_BROWSER];
  return Array.isArray(browser)
    ? browser.length
      ? browser
      : [DEFAULT_BROWSER]
    : [browser];
};

export const resolveConcurrency = (config?: VTTConfig): number => {
  const concurrency = config?.concurrency;
  if (
    typeof concurrency !== "number" ||
    !Number.isFinite(concurrency) ||
    concurrency <= 0
  )
    return DEFAULT_CONCURRENCY;
  return Math.floor(concurrency);
};

export const resolveScreenshotDir = (config?: VTTConfig): string => {
  return config?.screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
};

/**
 * Resolves final configuration with priority order:
 * 1. Config file (vtt.config.ts)
 * 2. Process arguments (--include, --exclude, etc.)
 * 3. Function parameters (highest priority)
 */
export const resolveFinalConfig = async (
  options: Partial<VTTConfig> = {}
): Promise<VTTConfig> => {
  // 1. Load config file
  const configFile = await loadConfigFile();
  if (!configFile) {
    throw new ConfigError("visual-testing-tool.config not found");
  }

  // 2. Parse process arguments
  const processArgs = parseIncludeExclude(process.argv.slice(2));

  // 3. Merge with priority: config file → process args → function options
  const finalConfig: VTTConfig = {
    ...configFile,
    storybook: {
      ...configFile.storybook,
      ...(options.storybook ? { ...options.storybook } : {}),
    },
    // Process args override config file
    ...(processArgs.include ? { include: processArgs.include } : {}),
    ...(processArgs.exclude ? { exclude: processArgs.exclude } : {}),
    ...(processArgs.dryRun !== undefined ? { dryRun: processArgs.dryRun } : {}),
    ...(processArgs.json !== undefined ? { jsonReport: processArgs.json } : {}),
    // Function options override process args and config file
    ...(options.browser ? { browser: options.browser } : {}),
    ...(options.screenshotDir ? { screenshotDir: options.screenshotDir } : {}),
    ...(options.threshold !== undefined
      ? { threshold: options.threshold }
      : {}),
    ...(options.concurrency !== undefined
      ? { concurrency: options.concurrency }
      : {}),
    ...(options.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
    ...(options.jsonReport !== undefined
      ? { jsonReport: options.jsonReport }
      : {}),
    ...(options.useDocker !== undefined
      ? { useDocker: options.useDocker }
      : {}),
    // Top-level include/exclude for convenience
    ...(options.include ? { include: options.include } : {}),
    ...(options.exclude ? { exclude: options.exclude } : {}),
  };

  return finalConfig;
};
