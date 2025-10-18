// Cache package info to avoid repeated file system reads
let cachedPackageInfo: {
  name: string;
  version: string;
  description: string;
} | null = null;

/**
 * Retrieves package information (name, version, description) with caching.
 * @returns Promise resolving to package information object.
 */
export async function getPackageInfo() {
  if (cachedPackageInfo) {
    return cachedPackageInfo;
  }

  let pkg: { name: string; version: string; description: string } = {
    name: "visnap",
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

// Configuration utilities
export {
  loadConfigFile,
  resolveScreenshotDir,
  resolveEffectiveConfig,
} from "./config";

// Comparison utilities
export { compareTestCases } from "@/comparison";
export type { CompareOptions, CompareResult } from "@/comparison";

// Test execution utilities
export { createConcurrencyPool } from "@/test";

// Browser utilities
export { loadBrowserAdapter, BrowserAdapterPool } from "@/browser";
export type { BrowserTarget } from "@/browser";

// General utilities
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

// Docker utilities
export { runInDocker, runInDockerWithConfig } from "@/docker";
export type { DockerRunOptions, DockerConfigOptions } from "@/docker";

// Re-export constants
export { DEFAULT_DOCKER_IMAGE } from "@/constants";
