import { writeFile, unlink } from "fs/promises";
import { join } from "path";

import type {
  BrowserAdapter,
  TestCaseAdapter,
  TestCaseInstance,
  VisualTestingToolConfig,
  ScreenshotResult,
  PageWithEvaluate,
  RunOutcome,
  BrowserName,
  BrowserConfiguration,
} from "@visual-testing-tool/protocol";

import log from "./logger";

import { DEFAULT_CONCURRENCY, DEFAULT_CAPTURE_TIMEOUT_MS, DEFAULT_BROWSER } from "@/constants";
import { compareBaseAndCurrentWithTestCases } from "@/lib/compare";
import { logEffectiveConfig } from "@/lib/config";
import { ensureVttDirectories, getBaseDir, getCurrentDir } from "@/utils/fs";

type BrowserTarget = { name: BrowserName; options?: Record<string, unknown> };

function parseBrowsersFromConfig(
  adaptersConfig: VisualTestingToolConfig["adapters"]
): BrowserTarget[] {
  const browserConfig = adaptersConfig?.browser?.options;
  const browserConfigurations = browserConfig?.browser as
    | BrowserConfiguration
    | BrowserConfiguration[]
    | undefined;

  if (!browserConfigurations) return [{ name: DEFAULT_BROWSER }];

  if (Array.isArray(browserConfigurations)) {
    return browserConfigurations.map(config =>
      typeof config === "string"
        ? { name: config as BrowserName }
        : { name: config.name, options: config.options }
    );
  }

  if (typeof browserConfigurations === "string") {
    return [{ name: browserConfigurations as BrowserName }];
  }

  return [
    {
      name: browserConfigurations.name,
      options: browserConfigurations.options,
    },
  ];
}

async function startAdapterAndResolvePageUrl(
  testCaseAdapter: TestCaseAdapter
): Promise<string> {
  const startResult = (await testCaseAdapter?.start?.()) ?? {};
  const { baseUrl, initialPageUrl } = startResult as {
    baseUrl?: string;
    initialPageUrl?: string;
  };
  const pageUrl = initialPageUrl ?? baseUrl;
  if (!pageUrl) {
    throw new Error(
      "Test case adapter must provide either baseUrl or initialPageUrl"
    );
  }
  return pageUrl;
}

function sortCasesStable(cases: TestCaseInstance[]): void {
  cases.sort((a, b) => {
    const caseCompare = a.caseId.localeCompare(b.caseId);
    if (caseCompare !== 0) return caseCompare;
    return a.variantId.localeCompare(b.variantId);
  });
}

function computeBatchSize(totalCases: number): number {
  return Math.min(50, Math.max(10, Math.floor(totalCases / 4)));
}

async function discoverCases(
  testCaseAdapter: TestCaseAdapter,
  page: PageWithEvaluate,
  viewport: VisualTestingToolConfig["viewport"]
): Promise<TestCaseInstance[]> {
  return (await testCaseAdapter.listCases(page, {
    viewport,
  })) as unknown as TestCaseInstance[];
}

function expandCasesForBrowsers(
  discoveredCases: TestCaseInstance[],
  browsers: BrowserTarget[]
): (TestCaseInstance & { browser: BrowserName })[] {
  const expanded: Array<TestCaseInstance & { browser: BrowserName }> = [];
  for (const discovered of discoveredCases) {
    for (const browser of browsers) {
      expanded.push({
        ...discovered,
        variantId: `${discovered.variantId}-${browser.name}`,
        browser: browser.name,
      } as TestCaseInstance & { browser: BrowserName });
    }
  }
  return expanded;
}

async function summarizeTestMode(
  options: VisualTestingToolConfig,
  cases: TestCaseInstance[],
  captureResults: { id: string; result?: ScreenshotResult; error?: string }[]
): Promise<{
  outcome: RunOutcome;
  failures: Array<{ id: string; reason: string; diffPercentage?: number }>;
  captureFailures: Array<{ id: string; error: string }>;
}> {
  const results = await compareBaseAndCurrentWithTestCases(options, cases);

  const passed = results.filter(r => r.match).length;
  const failedCaptures = captureResults.filter(r => r.error).length;
  const failedDiffs = results.filter(
    r => !r.match && r.reason === "pixel-diff"
  ).length;
  const failedMissingCurrent = results.filter(
    r => !r.match && r.reason === "missing-current"
  ).length;
  const failedMissingBase = results.filter(
    r => !r.match && r.reason === "missing-base"
  ).length;
  const failedErrors = results.filter(
    r => !r.match && r.reason === "error"
  ).length;

  for (const r of results) {
    if (r.match) {
      log.success(`Passed: ${r.id}`);
    } else {
      const reasonText = r.diffPercentage
        ? `${r.reason} (${r.diffPercentage}% difference)`
        : r.reason;
      log.error(`Failed: ${r.id} >> ${reasonText}`);
    }
  }

  if (failedCaptures > 0) {
    log.warn(`Capture failures: ${failedCaptures}`);
  }
  log.info(
    `Summary => total:${results.length}, passed:${passed}, diffs:${failedDiffs}, missing-current:${failedMissingCurrent}, missing-base:${failedMissingBase}, errors:${failedErrors}`
  );

  const outcome: RunOutcome = {
    total: results.length,
    passed,
    failedDiffs,
    failedMissingCurrent,
    failedMissingBase,
    failedErrors,
    captureFailures: failedCaptures,
  };

  const failures = results
    .filter(r => !r.match)
    .map(r => ({
      id: r.id,
      reason: r.reason,
      diffPercentage: r.diffPercentage,
    }));

  const captureFailures = captureResults
    .filter(r => r.error)
    .map(r => ({ id: r.id, error: r.error! }));

  return { outcome, failures, captureFailures };
}

function summarizeUpdateMode(
  captureResults: { id: string; result?: ScreenshotResult; error?: string }[]
): {
  outcome: RunOutcome;
  captureFailures: Array<{ id: string; error: string }>;
} {
  const total = captureResults.length;
  const successful = captureResults.filter(r => r.result).length;
  const failedCaptures = captureResults.filter(r => r.error).length;
  const outcome: RunOutcome = {
    total,
    passed: successful,
    failedDiffs: 0,
    failedMissingCurrent: 0,
    failedMissingBase: 0,
    failedErrors: 0,
    captureFailures: failedCaptures,
  };

  const captureFailures = captureResults
    .filter(r => r.error)
    .map(r => ({ id: r.id, error: r.error! }));

  return { outcome, captureFailures };
}

// New function after tool agnostic design
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

  // Tool-agnostic dynamic adapter loaders
  const loadBrowserAdapter = async (): Promise<BrowserAdapter> => {
    const moduleName = adapters?.browser?.name;
    if (!moduleName) throw new Error("Browser adapter is required");
    const browserAdapterOptions = adapters?.browser?.options as
      | Record<string, unknown>
      | undefined;

    const mod = await import(moduleName);
    if (typeof (mod as any)?.createAdapter === "function") {
      return (mod as any).createAdapter(browserAdapterOptions);
    }

    throw new Error(
      `Browser adapter ${moduleName} must export createAdapter function`
    );
  };

  const loadTestCaseAdapter = async (): Promise<TestCaseAdapter> => {
    const first = adapters?.testCase?.[0];
    const moduleName = first?.name;
    const adapterOptions = first?.options as
      | Record<string, unknown>
      | undefined;
    if (!moduleName) throw new Error("Test case adapter is required");

    const mod = await import(moduleName);
    if (typeof (mod as any)?.createAdapter === "function") {
      return (mod as any).createAdapter(adapterOptions);
    }

    throw new Error(
      `Test case adapter ${moduleName} must export createAdapter function`
    );
  };

  const testCaseAdapter = await loadTestCaseAdapter();

  let page: PageWithEvaluate | undefined;
  let cases: TestCaseInstance[] = [];
  let captureResults: {
    id: string;
    result?: ScreenshotResult;
    error?: string;
  }[] = [];
  const tempFiles: string[] = [];
  const browserAdapters = new Map<BrowserName, BrowserAdapter>();

  // Function to get or create a browser adapter for a specific browser
  const getBrowserAdapter = async (
    browserName: BrowserName,
    browserOptions?: Record<string, unknown>
  ): Promise<BrowserAdapter> => {
    if (!browserAdapters.has(browserName)) {
      const adapter = await loadBrowserAdapter();
      await adapter.init({
        browser: browserName,
        ...(browserOptions && { options: browserOptions }),
      });
      browserAdapters.set(browserName, adapter);
    }
    return browserAdapters.get(browserName)!;
  };

  try {
    // Determine browser configuration
    const browsersToUse: BrowserTarget[] = parseBrowsersFromConfig(adapters);

    // Start test-case adapter and resolve page URL
    const pageUrl = await startAdapterAndResolvePageUrl(testCaseAdapter);

    // For multi-browser, we need to discover cases first, then run them on each browser
    if (browsersToUse.length > 1) {
      // Initialize with first browser to discover test cases
      const discoveryAdapter = await getBrowserAdapter(
        browsersToUse[0].name,
        browsersToUse[0].options
      );

      if (!discoveryAdapter.openPage) {
        throw new Error("Browser adapter does not support openPage method");
      }
      page = (await discoveryAdapter.openPage(
        pageUrl
      )) as unknown as PageWithEvaluate;

      // Discover test cases with global viewport configuration
      const discoveredCases = await discoverCases(
        testCaseAdapter,
        page,
        options.viewport
      );

      // Close the discovery page
      await page?.close?.();
      page = undefined;

      // Expand cases for each browser
      cases = expandCasesForBrowsers(discoveredCases, browsersToUse);
    } else {
      // Single browser mode (existing behavior)
      const browserConfig = browsersToUse[0];
      const singleAdapter = await getBrowserAdapter(
        browserConfig.name,
        browserConfig.options
      );

      if (!singleAdapter.openPage) {
        throw new Error("Browser adapter does not support openPage method");
      }
      page = (await singleAdapter.openPage(
        pageUrl
      )) as unknown as PageWithEvaluate;

      // Discover and expand test cases to concrete variants with global viewport configuration
      cases = await discoverCases(testCaseAdapter, page, options.viewport);
    }

    // Sort cases deterministically by caseId, then variantId
    sortCasesStable(cases);

    captureResults = [];
    const maxConcurrency = Math.max(
      1,
      options.runtime?.maxConcurrency ?? DEFAULT_CONCURRENCY
    );
    const batchSize = computeBatchSize(cases.length); // Simple batching

    // Prepare output directory based on mode
    ensureVttDirectories(options.screenshotDir);
    const outDir =
      mode === "test"
        ? getCurrentDir(options.screenshotDir)
        : getBaseDir(options.screenshotDir);

    log.info(
      `Running ${cases.length} test cases in batches of ${batchSize} with max concurrency: ${maxConcurrency}`
    );

    // Process in batches to manage memory
    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, i + batchSize);
      const queue: Promise<void>[] = [];
      let active = 0;

      const runCapture = async (variant: TestCaseInstance) => {
        const id = `${variant.caseId}-${variant.variantId}`;
        const variantWithBrowser = variant as TestCaseInstance & {
          browser?: BrowserName;
        };
        const browserInfo = variantWithBrowser.browser
          ? ` (${variantWithBrowser.browser})`
          : "";
        log.dim(`Taking screenshot for: ${id}${browserInfo}`);

        try {
          // Get the appropriate browser adapter for this variant
          let adapterToUse: BrowserAdapter;
          if (variantWithBrowser.browser) {
            const browserConfig = browsersToUse.find(
              b => b.name === variantWithBrowser.browser
            );
            adapterToUse = await getBrowserAdapter(
              variantWithBrowser.browser,
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
          const finalPath = join(outDir, `${result.meta.id}.png`);
          const tmpPath = `${finalPath}.tmp`;
          tempFiles.push(tmpPath);

          await writeFile(tmpPath, result.buffer);
          await import("fs/promises")
            .then(m => m.rename(tmpPath, finalPath))
            .catch(async () => {
              await writeFile(finalPath, result.buffer);
            });

          // Remove from temp files on success
          const index = tempFiles.indexOf(tmpPath);
          if (index > -1) tempFiles.splice(index, 1);

          captureResults.push({
            id,
            result: { ...result, buffer: new Uint8Array(0) },
          }); // Empty buffer
        } catch (e) {
          const message = (e as Error)?.message ?? String(e);
          log.error(`Capture failed for ${id}: ${message}`);
          captureResults.push({ id, error: message });
        }
      };

      const schedule = async (variant: TestCaseInstance) => {
        while (active >= maxConcurrency && queue.length > 0) {
          await Promise.race(queue);
        }
        active++;
        const p = runCapture(variant).finally(() => {
          active--;
          const idx = queue.indexOf(p);
          if (idx >= 0) queue.splice(idx, 1);
        });
        queue.push(p);
      };

      for (const variant of batch) {
        await schedule(variant);
      }
      await Promise.all(queue);

      // Force garbage collection between batches if available
      if (global.gc) {
        global.gc();
      }
    }
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
        const disposePromises = Array.from(browserAdapters.values()).map(
          async adapter => {
            try {
              await adapter.dispose();
            } catch (error) {
              log.dim(`Error disposing browser adapter: ${error}`);
            }
          }
        );
        await Promise.all(disposePromises);

        try {
          await testCaseAdapter.stop?.();
        } catch (error) {
          log.dim(`Error stopping test case adapter: ${error}`);
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
    const { outcome, captureFailures } = summarizeUpdateMode(captureResults);
    return { outcome, captureFailures };
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempFiles: string[]): Promise<void> {
  const cleanupPromises = tempFiles.map(async file => {
    try {
      await unlink(file);
    } catch (error) {
      // Ignore errors during cleanup - file might not exist
      log.dim(`Failed to cleanup temp file ${file}: ${error}`);
    }
  });

  await Promise.all(cleanupPromises);
  tempFiles.length = 0; // Clear the array
}
