import { existsSync } from "fs";
import { join } from "path";

import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";
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

export const resolveEffectiveConfig = async (
  options: Partial<VisualTestingToolConfig> = {}
): Promise<VisualTestingToolConfig> => {
  const configFile = await loadConfigFile();
  if (!configFile) {
    throw new ConfigError("visual-testing-tool.config not found");
  }
  // TODO: Make sure nested configs are merged in mature versions
  return { ...configFile, ...options };
};
