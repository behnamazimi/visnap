export async function getPackageInfo() {
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

  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg?.description,
  };
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
export type { BrowserName, ViewportConfig, ViewportSize } from "./config";
export { compareBaseAndCurrentWithTestCases } from "./compare";
export type { CompareOptions, CompareResult } from "./compare";
export { createConcurrencyPool } from "./pool";

// Additional types that might be useful externally
export type { VTTStory } from "@/types";

// Utilities for CLI and other packages
export {
  getErrorMessage,
  log,
  generateConfigContent,
  setQuietMode,
  isQuiet,
} from "@/utils";
export { runInDocker, runInDockerWithConfig } from "../utils/docker";
export type { DockerRunOptions, DockerConfigOptions } from "../utils/docker";

// Re-export constants
export { DEFAULT_DOCKER_IMAGE } from "../constants";
