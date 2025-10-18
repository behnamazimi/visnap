/**
 * @fileoverview Screenshot capture execution with concurrency control
 */

import type {
  BrowserAdapter,
  TestCaseInstanceMeta,
  ScreenshotResult,
  BrowserName,
} from "@visnap/protocol";

import { DEFAULT_CAPTURE_TIMEOUT_MS } from "@/constants";
import { createConcurrencyPool } from "@/lib/pool";
import {
  writeScreenshotToFile,
  cleanupTempFiles,
} from "@/test/screenshot-writer";
import log from "@/utils/logger";
import { roundToTwoDecimals } from "@/utils/math";

/**
 * Result of a screenshot capture operation
 */
export interface CaptureResult {
  id: string;
  result?: ScreenshotResult;
  error?: string;
  captureDurationMs?: number;
  captureFilename?: string;
}

/**
 * Executes screenshot capture for test cases with concurrency control
 * @param cases - Test case instances to capture
 * @param getBrowserAdapter - Function to get browser adapter for a specific browser
 * @param storage - Storage adapter for writing screenshots
 * @param mode - Capture mode ("test" or "update")
 * @param maxConcurrency - Maximum number of concurrent captures
 * @returns Promise resolving to capture results
 */
export async function executeCapture(
  cases: (TestCaseInstanceMeta & { browser: BrowserName })[],
  getBrowserAdapter: (
    browserName: BrowserName,
    browserOptions?: Record<string, unknown>
  ) => Promise<BrowserAdapter>,
  storage: any, // StorageAdapter type
  mode: "test" | "update",
  maxConcurrency: number
): Promise<CaptureResult[]> {
  const tempFiles = new Set<string>();

  try {
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
        const adapterToUse = await getBrowserAdapter(
          variant.browser,
          undefined // browserOptions would be passed from the caller
        );

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
    return results;
  } catch (error) {
    // Cleanup temporary files on failure
    if (tempFiles.size > 0) {
      log.info(`Cleaning up ${tempFiles.size} temporary files due to failure`);
      await cleanupTempFiles(Array.from(tempFiles));
    }
    throw error;
  }
}
