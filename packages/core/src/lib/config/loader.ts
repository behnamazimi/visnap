/**
 * @fileoverview Configuration file loading utilities
 */

import { existsSync } from "fs";
import { isAbsolute, join, resolve } from "path";

import { type VisualTestingToolConfig } from "@visnap/protocol";
import { bundleRequire } from "bundle-require";

import { validateConfig } from "../config-schema";

import { ConfigError } from "@/utils/error-handler";

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

