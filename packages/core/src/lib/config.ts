import { existsSync } from "fs";
import { isAbsolute, join, resolve } from "path";

import { type VisualTestingToolConfig } from "@visnap/protocol";
import { bundleRequire } from "bundle-require";
import merge from "lodash/merge.js";

import {
  DEFAULT_SCREENSHOT_DIR,
  DEFAULT_CONCURRENCY,
  DEFAULT_COMPARISON_CORE,
  DEFAULT_THRESHOLD,
  DEFAULT_DIFF_COLOR,
} from "@/constants";
import { ConfigError } from "@/utils/error-handler";

/**
 * Resolve the effective path to the configuration file.
 * - If an explicit path is provided, resolve and return it as-is.
 * - Otherwise, return the first existing default among TS/JS in the CWD.
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

export const loadConfigFile = async (
  configPath?: string
): Promise<VisualTestingToolConfig | null> => {
  const filepath = resolveConfigPath(configPath);
  if (!filepath) return null;
  const { mod } = await bundleRequire({ filepath });
  const config = (mod?.default ?? mod) as unknown;
  return config as VisualTestingToolConfig;
};

export const resolveScreenshotDir = (screenshotDir?: string): string => {
  return screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
};

function applyEnvOverrides(
  cfg: VisualTestingToolConfig
): VisualTestingToolConfig {
  const out = { ...cfg };
  if (process.env.VISNAP_SCREENSHOT_DIR) {
    out.screenshotDir = process.env.VISNAP_SCREENSHOT_DIR;
  }

  // Handle comparison config overrides
  if (
    process.env.VISNAP_COMPARISON_CORE ||
    process.env.VISNAP_COMPARISON_THRESHOLD ||
    process.env.VISNAP_COMPARISON_DIFF_COLOR ||
    process.env.VISNAP_THRESHOLD
  ) {
    out.comparison = {
      core:
        (process.env.VISNAP_COMPARISON_CORE as
          | "odiff"
          | "pixelmatch"
          | undefined) ??
        out.comparison?.core ??
        DEFAULT_COMPARISON_CORE,
      threshold: out.comparison?.threshold ?? DEFAULT_THRESHOLD,
      diffColor: out.comparison?.diffColor ?? DEFAULT_DIFF_COLOR,
    };

    if (process.env.VISNAP_COMPARISON_THRESHOLD) {
      const n = Number(process.env.VISNAP_COMPARISON_THRESHOLD);
      if (!Number.isNaN(n)) out.comparison.threshold = n;
    } else if (process.env.VISNAP_THRESHOLD) {
      // Backward compatibility for old VISNAP_THRESHOLD env var
      const n = Number(process.env.VISNAP_THRESHOLD);
      if (!Number.isNaN(n)) out.comparison.threshold = n;
    }
    if (process.env.VISNAP_COMPARISON_DIFF_COLOR) {
      out.comparison.diffColor = process.env.VISNAP_COMPARISON_DIFF_COLOR;
    }
  }

  return out;
}

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

  const withEnv = applyEnvOverrides(merged);
  // ensure defaults
  withEnv.screenshotDir = resolveScreenshotDir(withEnv.screenshotDir);

  // Ensure comparison config has defaults
  if (!withEnv.comparison) {
    withEnv.comparison = {
      core: DEFAULT_COMPARISON_CORE,
      threshold: DEFAULT_THRESHOLD,
      diffColor: DEFAULT_DIFF_COLOR,
    };
  }

  return withEnv;
};

export const logEffectiveConfig = (config: VisualTestingToolConfig): void => {
  // Use dynamic import to avoid circular dependency
  import("@/utils/logger")
    .then(({ log }) => {
      log.info("Effective configuration:");
      log.dim(`  Screenshot directory: ${config.screenshotDir}`);
      log.dim(
        `  Comparison core: ${config.comparison?.core ?? DEFAULT_COMPARISON_CORE}`
      );
      log.dim(
        `  Comparison threshold: ${config.comparison?.threshold ?? DEFAULT_THRESHOLD}`
      );
      log.dim(
        `  Comparison diff color: ${config.comparison?.diffColor ?? DEFAULT_DIFF_COLOR}`
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
    })
    .catch(() => {
      // Fallback to console if logger is not available
      console.log("Effective configuration:");
      console.log(`  Screenshot directory: ${config.screenshotDir}`);
      console.log(
        `  Comparison core: ${config.comparison?.core ?? DEFAULT_COMPARISON_CORE}`
      );
      console.log(
        `  Comparison threshold: ${config.comparison?.threshold ?? DEFAULT_THRESHOLD}`
      );
      console.log(
        `  Comparison diff color: ${config.comparison?.diffColor ?? DEFAULT_DIFF_COLOR}`
      );
      console.log(
        `  Max concurrency: ${config.runtime?.maxConcurrency ?? DEFAULT_CONCURRENCY}`
      );
      console.log(`  Browser adapter: ${config.adapters.browser.name}`);
      console.log(`  Test case adapter: ${config.adapters.testCase[0]?.name}`);
      if (config.viewport) {
        const viewportKeys = Object.keys(config.viewport);
        console.log(
          `  Global viewports: ${viewportKeys.length} configured (${viewportKeys.join(", ")})`
        );
      }
    });
};
