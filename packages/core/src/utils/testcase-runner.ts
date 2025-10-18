import type {
  BrowserAdapter,
  TestCaseInstanceMeta,
  VisualTestingToolConfig,
  ScreenshotResult,
  RunOutcome,
  BrowserName,
} from "@visnap/protocol";

import { ensureVttDirectories } from "./fs";
import log from "./logger";
import { roundToTwoDecimals } from "./math";

import {
  loadBrowserAdapter,
  loadAllTestCaseAdapters,
  BrowserAdapterPool,
  loadStorageAdapter,
} from "@/browser/adapter-loader";
import { parseBrowsersFromConfig } from "@/browser/browser-config";
import { DEFAULT_CONCURRENCY, DEFAULT_CAPTURE_TIMEOUT_MS } from "@/constants";
import { logEffectiveConfig } from "@/lib/config";
import { createConcurrencyPool } from "@/lib/pool";
import {
  writeScreenshotToFile,
  cleanupTempFiles,
} from "@/test/screenshot-writer";
import { discoverCasesFromAllAdapters } from "@/test/test-discovery";
import { summarizeTestMode, summarizeUpdateMode } from "@/test/test-summary";

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
  let captureResults: {
    id: string;
    result?: ScreenshotResult;
    error?: string;
    captureDurationMs?: number;
    captureFilename?: string;
  }[] = [];
  const tempFiles = new Set<string>();
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

    captureResults = [];
    const mc = options.runtime?.maxConcurrency;
    const captureMax = typeof mc === "number" ? mc : mc?.capture;
    const maxConcurrency = Math.max(1, captureMax ?? DEFAULT_CONCURRENCY);

    ensureVttDirectories(options.screenshotDir);

    log.info(
      `Running ${cases.length} test cases with max concurrency: ${maxConcurrency}`
    );

    // Create concurrency pool for processing test cases
    const runWithPool = createConcurrencyPool({ concurrency: maxConcurrency });

    const runCapture = async (
      variant: TestCaseInstanceMeta & { browser: BrowserName },
      _index: number
    ) => {
      const id = `${variant.caseId}-${variant.variantId}`;
      const captureFilename = `${id}.png`;
      const browserInfo = variant.browser ? ` (${variant.browser})` : "";
      log.dim(`Taking screenshot for: ${id}${browserInfo}`);

      const captureStartTime = performance.now();

      try {
        // Get the appropriate browser adapter for this variant
        let adapterToUse: BrowserAdapter;
        if (variant.browser) {
          const browserConfig = browsersToUse.find(
            b => b.name === variant.browser
          );
          adapterToUse = await getBrowserAdapter(
            variant.browser,
            browserConfig?.options
          );
        } else {
          // Fallback to first browser if no browser specified
          const firstBrowser = browsersToUse[0];
          adapterToUse = await getBrowserAdapter(
            firstBrowser.name,
            firstBrowser.options
          );
        }

        // Add timeout protection to prevent hanging
        const abortController = new AbortController();
        const capturePromise = adapterToUse.capture({
          id,
          url: variant.url,
          screenshotTarget: variant.screenshotTarget,
          viewport: variant.viewport,
          disableCSSInjection: variant.disableCSSInjection,
          interactions: variant.interactions,
          elementsToMask: variant.elementsToMask,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeoutId = setTimeout(() => {
            abortController.abort();
            reject(
              new Error(`Capture timeout after ${DEFAULT_CAPTURE_TIMEOUT_MS}ms`)
            );
          }, DEFAULT_CAPTURE_TIMEOUT_MS);

          // Clean up timeout if capture completes first
          abortController.signal.addEventListener("abort", () => {
            clearTimeout(timeoutId);
          });
        });

        const result = await Promise.race([capturePromise, timeoutPromise]);

        // Write screenshot to disk immediately to prevent memory accumulation
        // during concurrent captures. The buffer is written to disk and then
        // cleared from memory to reduce memory pressure.
        const finalPath = await writeScreenshotToFile(
          result.buffer,
          storage,
          result.meta.id,
          mode === "update" ? "base" : "current"
        );
        tempFiles.add(finalPath);

        // Remove from temp files on success
        tempFiles.delete(finalPath);

        const captureDurationMs = roundToTwoDecimals(
          performance.now() - captureStartTime
        );

        return {
          id,
          result: {
            buffer: new Uint8Array(0), // Buffer already written to disk
            meta: result.meta,
          },
          captureDurationMs,
          captureFilename,
        };
      } catch (e) {
        const message = (e as Error)?.message ?? String(e);
        log.error(`Capture failed for ${id}: ${message}`);
        const captureDurationMs = roundToTwoDecimals(
          performance.now() - captureStartTime
        );
        return {
          id,
          error: message,
          captureDurationMs,
          captureFilename,
        };
      }
    };

    // Process all test cases using the concurrency pool
    const results = await runWithPool(cases, runCapture);
    captureResults = results;
  } catch (error) {
    // Cleanup temporary files on failure
    if (tempFiles.size > 0) {
      log.info(`Cleaning up ${tempFiles.size} temporary files due to failure`);
      await cleanupTempFiles(Array.from(tempFiles));
    }
    throw error;
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
