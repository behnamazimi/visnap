import { existsSync } from "fs";
import { join } from "path";

import { type VisualTestingToolConfig } from "@vividiff/protocol";
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

export type BrowserName = "chromium" | "firefox" | "webkit";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportConfig {
  [key: string]: ViewportSize;
}

export interface ViewportMap {
  [key: string]: ViewportSize;
}

export const getConfigTsPath = (): string =>
  join(process.cwd(), "vividiff.config.ts");

export const loadConfigFile =
  async (): Promise<VisualTestingToolConfig | null> => {
    const tsPath = getConfigTsPath();
    if (!existsSync(tsPath)) return null;
    const { mod } = await bundleRequire({ filepath: tsPath });
    const config = (mod?.default ?? mod) as unknown;
    return config as VisualTestingToolConfig;
  };

export const resolveScreenshotDir = (screenshotDir?: string): string => {
  return screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
};

// use lodash.merge for deep merging configs

function applyEnvOverrides(
  cfg: VisualTestingToolConfig
): VisualTestingToolConfig {
  const out = { ...cfg };
  if (process.env.VIVIDIFF_SCREENSHOT_DIR) {
    out.screenshotDir = process.env.VIVIDIFF_SCREENSHOT_DIR;
  }
  if (process.env.VIVIDIFF_MAX_CONCURRENCY) {
    const n = Number(process.env.VIVIDIFF_MAX_CONCURRENCY);
    const nextRuntime = { ...(out.runtime ?? {}) } as NonNullable<
      VisualTestingToolConfig["runtime"]
    >;
    if (!Number.isNaN(n)) nextRuntime.maxConcurrency = n;
    out.runtime = nextRuntime;
  }

  // Handle comparison config overrides
  if (
    process.env.VIVIDIFF_COMPARISON_CORE ||
    process.env.VIVIDIFF_COMPARISON_THRESHOLD ||
    process.env.VIVIDIFF_COMPARISON_DIFF_COLOR ||
    process.env.VIVIDIFF_THRESHOLD
  ) {
    out.comparison = {
      core:
        (process.env.VIVIDIFF_COMPARISON_CORE as any) ??
        out.comparison?.core ??
        DEFAULT_COMPARISON_CORE,
      threshold: out.comparison?.threshold ?? DEFAULT_THRESHOLD,
      diffColor: out.comparison?.diffColor ?? DEFAULT_DIFF_COLOR,
    };

    if (process.env.VIVIDIFF_COMPARISON_THRESHOLD) {
      const n = Number(process.env.VIVIDIFF_COMPARISON_THRESHOLD);
      if (!Number.isNaN(n)) out.comparison.threshold = n;
    } else if (process.env.VIVIDIFF_THRESHOLD) {
      // Backward compatibility for old VIVIDIFF_THRESHOLD env var
      const n = Number(process.env.VIVIDIFF_THRESHOLD);
      if (!Number.isNaN(n)) out.comparison.threshold = n;
    }
    if (process.env.VIVIDIFF_COMPARISON_DIFF_COLOR) {
      out.comparison.diffColor = process.env.VIVIDIFF_COMPARISON_DIFF_COLOR;
    }
  }

  return out;
}

export const resolveEffectiveConfig = async (
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: { include?: string | string[]; exclude?: string | string[] }
): Promise<VisualTestingToolConfig> => {
  const configFile = await loadConfigFile();
  if (!configFile) {
    throw new ConfigError("vividiff.config not found");
  }
  const merged = merge({}, configFile, options);

  // Apply CLI option overrides if provided
  if (cliOptions && (cliOptions.include || cliOptions.exclude)) {
    // Override the test case adapter options with CLI options
    // For now we only support one test case adapter
    if (merged.adapters.testCase[0]) {
      merged.adapters.testCase[0].options = {
        ...merged.adapters.testCase[0].options,
        include: cliOptions.include,
        exclude: cliOptions.exclude,
      } as any;
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { log } = require("@/utils/logger");
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
};
