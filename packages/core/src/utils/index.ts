// Export utilities that are needed by CLI and other packages
export { getErrorMessage } from "./error-handler";
export { default as log, setQuietMode, isQuiet } from "./logger";
export { runInDocker, runInDockerWithConfig } from "./docker";
export type { DockerRunOptions, DockerConfigOptions } from "./docker";
export { generateConfigContent } from "./config-generator";

// Export new testcase-runner utilities
export {
  loadBrowserAdapter,
  loadTestCaseAdapter,
  BrowserAdapterPool,
} from "./adapter-loader";
export { parseBrowsersFromConfig } from "./browser-config";
export type { BrowserTarget } from "./browser-config";
export {
  startAdapterAndResolvePageUrl,
  discoverTestCasesWithBrowsers,
  discoverCases,
  expandCasesForBrowsers,
  sortCasesStable,
} from "./test-discovery";
export { writeScreenshotToFile, cleanupTempFiles } from "./screenshot-writer";
export { summarizeTestMode, summarizeUpdateMode } from "./test-summary";
