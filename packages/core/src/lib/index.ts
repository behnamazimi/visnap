export async function getPackageInfo() {
  let pkg: { name: string; version: string; description: string } = {
    name: "visual-testing-tool",
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
export { runTests, updateBaseline, initializeProject } from "./api";

// High-level API types
export type {
  TestOptions,
  UpdateOptions,
  InitOptions,
  TestResult,
  BrowserTestResult,
  UpdateResult,
  InitResult,
} from "./api";

// Low-level utilities
export {
  configFileExists,
  loadConfigFile,
  resolveBrowsers,
  resolveConcurrency,
  resolveScreenshotDir,
  resolveFinalConfig,
} from "./config";
export type { VTTConfig, BrowserName } from "./config";
export {
  compareDirectories,
  compareBaseAndCurrentWithStories,
} from "./compare";
export type { CompareOptions, CompareResult } from "./compare";
export { launchBrowser, openPage } from "./browser";
export { createConcurrencyPool } from "./pool";
export { createStoryFilter } from "./storiesFilter";

// Additional types that might be useful externally
export type { VTTStory } from "../types";
