/**
 * @fileoverview Test execution domain exports
 *
 * Provides test discovery, execution, screenshot capture, and concurrency
 * management utilities for visual testing operations.
 */

export {
  startAdapterAndResolvePageUrl,
  discoverTestCasesWithBrowsers,
  discoverCases,
  expandCasesForBrowsers,
  sortCasesStable,
} from "./test-discovery";
export { writeScreenshotToFile, cleanupTempFiles } from "./screenshot-writer";
export { summarizeTestMode, summarizeUpdateMode } from "./test-summary";
export { createConcurrencyPool } from "@/lib/pool";
