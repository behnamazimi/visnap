/**
 * @fileoverview High-level test execution orchestration
 */

import type {
  BrowserAdapter,
  TestCaseInstanceMeta,
  VisualTestingToolConfig,
  RunOutcome,
  BrowserName,
} from "@visnap/protocol";

import { executeCapture, type CaptureResult } from "./capture-executor";

import {
  loadBrowserAdapter,
  loadAllTestCaseAdapters,
  loadStorageAdapter,
} from "@/browser/adapter-loader";
import { parseBrowsersFromConfig } from "@/browser/browser-config";
import { BrowserAdapterPool } from "@/browser/browser-pool";
import { DEFAULT_CONCURRENCY } from "@/constants";
import { logEffectiveConfig } from "@/lib/config";
import { discoverCasesFromAllAdapters } from "@/test/test-discovery";
import { summarizeTestMode, summarizeUpdateMode } from "@/test/test-summary";
import { ensureViSnapDirectories } from "@/utils/fs";
import log from "@/utils/logger";

/**
 * Execute a visual test run with proper resource cleanup
 *
 * This function manages the complete lifecycle of a test run including:
 * - Browser adapter initialization and disposal
 * - Test case adapter lifecycle management
 * - Screenshot capture with timeout protection
 * - Temporary file cleanup on errors
 * - Proper resource disposal in finally blocks
 *
 * @param options - Visual testing configuration
 * @param mode - Either "test" for comparison mode or "update" for baseline update
 * @returns Promise resolving to test results with outcome and failure details
 */
export async function executeTestRun(
  options: VisualTestingToolConfig,
  mode: "test" | "update"
): Promise<{
  outcome?: RunOutcome;
  failures?: Array<{ id: string; reason: string; diffPercentage?: number }>;
  captureFailures?: Array<{ id: string; error: string }>;
}> {
  // Log effective configuration for traceability
  logEffectiveConfig(options);

  // Initialize storage adapter
  const storage = await loadStorageAdapter(options);

  // Track cleanup state to prevent double cleanup
  let isCleaningUp = false;

  const { adapters } = options;

  // Load test case adapters
  const testCaseAdapters = await loadAllTestCaseAdapters(adapters);

  let cases: (TestCaseInstanceMeta & { browser: BrowserName })[] = [];
  let captureResults: CaptureResult[] = [];
  const browserAdapterPool = new BrowserAdapterPool();

  // Function to get or create a browser adapter for a specific browser
  const getBrowserAdapter = async (
    browserName: BrowserName,
    browserOptions?: Record<string, unknown>
  ): Promise<BrowserAdapter> => {
    return browserAdapterPool.getAdapter(browserName, browserOptions, () =>
      loadBrowserAdapter(adapters)
    );
  };

  try {
    // Determine browser configuration
    const browsersToUse = parseBrowsersFromConfig(adapters);

    // Discover test cases from all adapters
    cases = await discoverCasesFromAllAdapters(
      testCaseAdapters,
      await getBrowserAdapter(browsersToUse[0].name, browsersToUse[0].options),
      options.viewport,
      browsersToUse
    );

    // Cases are already discovered and expanded by discoverCasesFromAllAdapters

    const maxConcurrencyConfig = options.runtime?.maxConcurrency;
    const captureMax =
      typeof maxConcurrencyConfig === "number"
        ? maxConcurrencyConfig
        : maxConcurrencyConfig?.capture;
    const maxConcurrency = Math.max(1, captureMax ?? DEFAULT_CONCURRENCY);

    ensureViSnapDirectories(options.screenshotDir);

    // Execute screenshot capture
    captureResults = await executeCapture(
      cases,
      getBrowserAdapter,
      storage,
      mode,
      maxConcurrency
    );
  } finally {
    // Ensure adapters are torn down regardless of capture/write outcomes
    if (!isCleaningUp) {
      isCleaningUp = true;
      try {
        await browserAdapterPool.disposeAll();

        // Clean up test case adapters
        for (const adapter of testCaseAdapters) {
          try {
            await adapter.stop?.();
          } catch (error) {
            log.warn(
              `Error stopping test case adapter ${adapter.name}: ${error}`
            );
          }
        }

        // Clean up storage adapter
        await storage.cleanup?.();
      } catch (error) {
        log.warn(`Error during adapter cleanup: ${error}`);
      }
    }
  }

  // Screenshots are already written to disk during capture

  if (mode === "test") {
    const { outcome, failures, captureFailures } = await summarizeTestMode(
      storage,
      options,
      cases,
      captureResults
    );
    return { outcome, failures, captureFailures };
  } else {
    const { outcome, captureFailures } = summarizeUpdateMode(
      captureResults,
      cases
    );
    return { outcome, captureFailures };
  }
}

/**
 * Discover test cases from all configured adapters
 * @param options - Visual testing configuration
 * @returns Promise resolving to discovered test cases
 */
export async function discoverTestCases(
  options: VisualTestingToolConfig
): Promise<(TestCaseInstanceMeta & { browser: BrowserName })[]> {
  const { adapters } = options;

  // Load adapters
  const testCaseAdapters = await loadAllTestCaseAdapters(adapters);
  const browserAdapter = await loadBrowserAdapter(adapters);

  // Determine browser configuration
  const browsersToUse = parseBrowsersFromConfig(adapters);

  try {
    // Initialize browser adapter for discovery
    await browserAdapter.init({
      browser: browsersToUse[0].name,
      ...(browsersToUse[0].options && { options: browsersToUse[0].options }),
    });

    // Discover test cases from all adapters
    return await discoverCasesFromAllAdapters(
      testCaseAdapters,
      browserAdapter,
      options.viewport,
      browsersToUse
    );
  } finally {
    // Clean up adapters
    try {
      await browserAdapter.dispose();
    } catch (error) {
      log.warn(`Error disposing browser adapter: ${error}`);
    }

    // Stop all test case adapters
    for (const adapter of testCaseAdapters) {
      try {
        await adapter.stop?.();
      } catch (error) {
        log.warn(`Error stopping test case adapter ${adapter.name}: ${error}`);
      }
    }
  }
}
