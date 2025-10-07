import { existsSync } from "fs";
import { join } from "path";

import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";
import merge from "lodash/merge";
import { bundleRequire } from "bundle-require";

import { DEFAULT_SCREENSHOT_DIR } from "@/constants";
import { ConfigError } from "@/utils/error-handler";

export type BrowserName = "chromium" | "firefox" | "webkit";

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportConfig {
  [key: string]: ViewportSize;
}

export const getConfigTsPath = (): string =>
  join(process.cwd(), "vtt.config.ts");

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

function applyEnvOverrides(cfg: VisualTestingToolConfig): VisualTestingToolConfig {
  const out = { ...cfg };
  if (process.env.VTT_SCREENSHOT_DIR) {
    out.screenshotDir = process.env.VTT_SCREENSHOT_DIR;
  }
  if (process.env.VTT_THRESHOLD) {
    const n = Number(process.env.VTT_THRESHOLD);
    if (!Number.isNaN(n)) out.threshold = n;
  }
  if (process.env.VTT_MAX_CONCURRENCY) {
    const n = Number(process.env.VTT_MAX_CONCURRENCY);
    const nextRuntime = { ...(out.runtime ?? {}) } as NonNullable<VisualTestingToolConfig["runtime"]>;
    if (!Number.isNaN(n)) nextRuntime.maxConcurrency = n;
    out.runtime = nextRuntime;
  }
  return out;
}

export const resolveEffectiveConfig = async (
  options: Partial<VisualTestingToolConfig> = {}
): Promise<VisualTestingToolConfig> => {
  const configFile = await loadConfigFile();
  if (!configFile) {
    throw new ConfigError("visual-testing-tool.config not found");
  }
  const merged = merge({}, configFile, options);
  const withEnv = applyEnvOverrides(merged);
  // ensure defaults
  withEnv.screenshotDir = resolveScreenshotDir(withEnv.screenshotDir);
  return withEnv;
};
