import type {
  BrowserAdapter,
  TestCaseInstanceMeta,
  VisualTestingToolConfig,
  ScreenshotResult,
  RunOutcome,
  BrowserName,
} from "@vividiff/protocol";

import {
  loadBrowserAdapter,
  loadAllTestCaseAdapters,
  BrowserAdapterPool,
} from "./adapter-loader";
import { parseBrowsersFromConfig } from "./browser-config";
import log from "./logger";
import { writeScreenshotToFile, cleanupTempFiles } from "./screenshot-writer";
import { discoverCasesFromAllAdapters } from "./test-discovery";
import { summarizeTestMode, summarizeUpdateMode } from "./test-summary";

import { DEFAULT_CONCURRENCY, DEFAULT_CAPTURE_TIMEOUT_MS } from "@/constants";
import { logEffectiveConfig } from "@/lib/config";
import { createConcurrencyPool } from "@/lib/pool";
import { ensureVttDirectories, getBaseDir, getCurrentDir } from "@/utils/fs";

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
      log.dim(`Error disposing browser adapter: ${error}`);
    }

    // Stop all test case adapters
    for (const adapter of testCaseAdapters) {
      try {
        await adapter.stop?.();
      } catch (error) {
        log.dim(`Error stopping test case adapter ${adapter.name}: ${error}`);
      }
    }
  }
}

export async function runTestCasesOnBrowser(
  options: VisualTestingToolConfig,
  mode: "test" | "update"
): Promise<{
  outcome?: RunOutcome;
  failures?: Array<{ id: string; reason: string; diffPercentage?: number }>;
  captureFailures?: Array<{ id: string; error: string }>;
}> {
  // Log effective configuration for traceability
  logEffectiveConfig(options);

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
  const tempFiles: string[] = [];
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
    const maxConcurrency = Math.max(
      1,
      options.runtime?.maxConcurrency ?? DEFAULT_CONCURRENCY
    );

    // Prepare output directory based on mode
    ensureVttDirectories(options.screenshotDir);
    const outDir =
      mode === "test"
        ? getCurrentDir(options.screenshotDir)
        : getBaseDir(options.screenshotDir);

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
        const capturePromise = adapterToUse.capture({
          id,
          url: variant.url,
          screenshotTarget: variant.screenshotTarget,
          viewport: variant.viewport,
          disableCSSInjection: variant.disableCSSInjection,
          interactions: variant.interactions,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () =>
              reject(
                new Error(
                  `Capture timeout after ${DEFAULT_CAPTURE_TIMEOUT_MS}ms`
                )
              ),
            DEFAULT_CAPTURE_TIMEOUT_MS
          );
        });

        const result = await Promise.race([capturePromise, timeoutPromise]);

        // Write screenshot immediately to disk instead of keeping in memory
        const finalPath = await writeScreenshotToFile(
          result.buffer,
          outDir,
          result.meta.id
        );
        tempFiles.push(finalPath);

        // Remove from temp files on success
        const tempIndex = tempFiles.indexOf(finalPath);
        if (tempIndex > -1) tempFiles.splice(tempIndex, 1);

        const captureDurationMs =
          Math.round((performance.now() - captureStartTime) * 100) / 100;

        return {
          id,
          result: { ...result, buffer: new Uint8Array(0) },
          captureDurationMs,
          captureFilename,
        }; // Empty buffer
      } catch (e) {
        const message = (e as Error)?.message ?? String(e);
        log.error(`Capture failed for ${id}: ${message}`);
        const captureDurationMs =
          Math.round((performance.now() - captureStartTime) * 100) / 100;
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
    if (tempFiles.length > 0) {
      log.info(
        `Cleaning up ${tempFiles.length} temporary files due to failure`
      );
      await cleanupTempFiles(tempFiles);
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
            log.dim(
              `Error stopping test case adapter ${adapter.name}: ${error}`
            );
          }
        }
      } catch (error) {
        log.dim(`Error during adapter cleanup: ${error}`);
      }
    }
  }

  // Screenshots are already written to disk during capture

  if (mode === "test") {
    const { outcome, failures, captureFailures } = await summarizeTestMode(
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
