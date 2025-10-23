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
