// Cache package info to avoid repeated file system reads
let cachedPackageInfo: {
  name: string;
  version: string;
  description: string;
} | null = null;

export async function getPackageInfo() {
  if (cachedPackageInfo) {
    return cachedPackageInfo;
  }

  let pkg: { name: string; version: string; description: string } = {
    name: "vividiff",
    version: "0.0.0",
    description: "Visual Testing Tool - CLI and programmatic API",
  };
  try {
    // When compiled, this file lives in dist/core/, so ../../package.json resolves correctly
    const packageJson = await import("../../package.json", {
      assert: { type: "json" },
    });
    pkg = packageJson.default;
  } catch {
    // Fallback to default values if package.json cannot be loaded
  }

  cachedPackageInfo = {
    name: pkg.name,
    version: pkg.version,
    description: pkg?.description,
  };

  return cachedPackageInfo;
}

// High-level API functions
export {
  updateBaseline,
  updateBaselineCli,
  initializeProject,
  runVisualTests,
  runVisualTestsCli,
  listTestCases,
  listTestCasesCli,
} from "./api";

// High-level API types
export type { InitOptions, InitResult, ListResult, TestResult } from "./api";

// Low-level utilities
export {
  loadConfigFile,
  resolveScreenshotDir,
  resolveEffectiveConfig,
} from "./config";
export { compareTestCases } from "./compare";
export type { CompareOptions, CompareResult } from "./compare";
export { createConcurrencyPool } from "./pool";

// Utilities for CLI and other packages
export {
  getErrorMessage,
  log,
  generateConfigContent,
  setQuietMode,
  isQuiet,
  createSafeViewport,
  validateViewport,
  DEFAULT_VIEWPORT,
  createDirectoryConfig,
  validateDirectoryConfig,
  DEFAULT_DIRECTORY_CONFIG,
  roundToDecimals,
  roundToTwoDecimals,
  PRECISION_MULTIPLIER,
  MIN_CONCURRENCY,
  FALLBACK_TIMEOUT,
  formatViewport,
} from "@/utils";
export type { DirectoryConfig } from "@/utils";
export { runInDocker, runInDockerWithConfig } from "../utils/docker";
export type { DockerRunOptions, DockerConfigOptions } from "../utils/docker";

// Re-export constants
export { DEFAULT_DOCKER_IMAGE } from "../constants";
