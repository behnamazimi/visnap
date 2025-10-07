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

import { compareBaseAndCurrentWithTestCases } from "@/lib/compare";
import { logEffectiveConfig } from "@/lib/config";
import { ensureVttDirectories, getBaseDir, getCurrentDir } from "@/utils/fs";

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
  
  const { adapters } = options;

  const loadBrowserAdapter = async (): Promise<BrowserAdapter> => {
    const name = adapters?.browser?.name;
    if (!name) throw new Error("Browser adapter is required");
    const browserAdapterOptions = adapters?.browser?.options;
    if (name === "@visual-testing-tool/playwright-adapter") {
      const { createPlaywrightAdapter } = await import(
        "@visual-testing-tool/playwright-adapter"
      );
      return createPlaywrightAdapter(
        browserAdapterOptions as Record<string, unknown>
      );
    }
    throw new Error(`Unsupported browser adapter: ${name}`);
  };

  const loadTestCaseAdapter = async (): Promise<TestCaseAdapter> => {
    const first = adapters?.testCase?.[0];
    const name = first?.name;
    const opts = first?.options;
    if (!name) throw new Error("Test case adapter is required");
    if (name === "@visual-testing-tool/storybook-adapter") {
      const { createStorybookAdapter } = await import(
        "@visual-testing-tool/storybook-adapter"
      );
      if (!opts) throw new Error("Test case adapter options are required");
      return createStorybookAdapter(
        opts as {
          source: string;
          port?: number;
          include?: string | string[];
          exclude?: string | string[];
        }
      );
    }
    throw new Error(`Unsupported test case adapter: ${name}`);
  };

  const testCaseAdapter = await loadTestCaseAdapter();

  let page: PageWithEvaluate | undefined;
  let cases: TestCaseInstance[] = [];
  let captureResults: { id: string; result?: ScreenshotResult; error?: string }[] = [];
  const tempFiles: string[] = [];
  const browserAdapters = new Map<BrowserName, BrowserAdapter>();

  // Function to get or create a browser adapter for a specific browser
  const getBrowserAdapter = async (browserName: BrowserName, browserOptions?: Record<string, unknown>): Promise<BrowserAdapter> => {
    if (!browserAdapters.has(browserName)) {
      const adapter = await loadBrowserAdapter();
      await adapter.init?.({ 
        browser: browserName,
        ...(browserOptions && { options: browserOptions })
      });
      browserAdapters.set(browserName, adapter);
    }
    return browserAdapters.get(browserName)!;
  };

  try {
    // Determine browser configuration
    const browserConfig = adapters?.browser?.options;
    const browserConfigurations = browserConfig?.browser as BrowserConfiguration | BrowserConfiguration[] | undefined;
    
    // Parse browser configurations into a standardized format
    let browsersToUse: Array<{ name: BrowserName; options?: Record<string, unknown> }>;
    
    if (!browserConfigurations) {
      browsersToUse = [{ name: "chromium" }]; // Default fallback
    } else if (Array.isArray(browserConfigurations)) {
      browsersToUse = browserConfigurations.map(config => 
        typeof config === 'string' 
          ? { name: config as BrowserName }
          : { name: config.name, options: config.options }
      );
    } else if (typeof browserConfigurations === 'string') {
      browsersToUse = [{ name: browserConfigurations as BrowserName }];
    } else {
      browsersToUse = [{ name: browserConfigurations.name, options: browserConfigurations.options }];
    }

    // Start test-case adapter first (browser-agnostic)
    const startResult = (await testCaseAdapter?.start?.()) ?? {};
    const { baseUrl, initialPageUrl } = startResult;

    // Use initialPageUrl from adapter, or fallback to baseUrl if no specific page is needed
    const pageUrl = initialPageUrl ?? baseUrl;
    if (!pageUrl) {
      throw new Error("Test case adapter must provide either baseUrl or initialPageUrl");
    }

    // For multi-browser, we need to discover cases first, then run them on each browser
    if (browsersToUse.length > 1) {
      // Initialize with first browser to discover test cases
      const discoveryAdapter = await getBrowserAdapter(browsersToUse[0].name, browsersToUse[0].options);
      
      if (!discoveryAdapter.openPage) {
        throw new Error("Browser adapter does not support openPage method");
      }
      page = (await discoveryAdapter.openPage(pageUrl)) as unknown as PageWithEvaluate;

      // Discover test cases with global viewport configuration
      const discoveredCases = (await testCaseAdapter.listCases(
        page,
        { viewport: options.viewport }
      )) as unknown as TestCaseInstance[];

      // Close the discovery page
      await page?.close?.();
      page = undefined;

      // Expand cases for each browser
      cases = [];
      for (const discoveredCase of discoveredCases) {
        for (const browserConfig of browsersToUse) {
          cases.push({
            ...discoveredCase,
            variantId: `${discoveredCase.variantId}-${browserConfig.name}`,
            browser: browserConfig.name,
          } as TestCaseInstance & { browser: BrowserName });
        }
      }
    } else {
      // Single browser mode (existing behavior)
      const browserConfig = browsersToUse[0];
      const singleAdapter = await getBrowserAdapter(browserConfig.name, browserConfig.options);
      
      if (!singleAdapter.openPage) {
        throw new Error("Browser adapter does not support openPage method");
      }
      page = (await singleAdapter.openPage(pageUrl)) as unknown as PageWithEvaluate;

      // Discover and expand test cases to concrete variants with global viewport configuration
      cases = (await testCaseAdapter.listCases(
        page,
        { viewport: options.viewport }
      )) as unknown as TestCaseInstance[];
    }
    
    // Sort cases deterministically by caseId, then variantId
    cases.sort((a, b) => {
      const caseCompare = a.caseId.localeCompare(b.caseId);
      if (caseCompare !== 0) return caseCompare;
      return a.variantId.localeCompare(b.variantId);
    });

    captureResults = [];
    const maxConcurrency = Math.max(1, options.runtime?.maxConcurrency ?? 4);
    const batchSize = Math.min(50, Math.max(10, Math.floor(cases.length / 4))); // Simple batching
    
    // Prepare output directory based on mode
    ensureVttDirectories(options.screenshotDir);
    const outDir =
      mode === "test"
        ? getCurrentDir(options.screenshotDir)
        : getBaseDir(options.screenshotDir);
    
    log.info(`Running ${cases.length} test cases in batches of ${batchSize} with max concurrency: ${maxConcurrency}`);
    
    // Process in batches to manage memory
    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, i + batchSize);
      const queue: Promise<void>[] = [];
      let active = 0;
      
      const runCapture = async (variant: TestCaseInstance) => {
        const id = `${variant.caseId}-${variant.variantId}`;
        const variantWithBrowser = variant as TestCaseInstance & { browser?: BrowserName };
        const browserInfo = variantWithBrowser.browser ? ` (${variantWithBrowser.browser})` : '';
        log.dim(`Taking screenshot for: ${id}${browserInfo}`);
        
        try {
          // Get the appropriate browser adapter for this variant
          let adapterToUse: BrowserAdapter;
          if (variantWithBrowser.browser) {
            const browserConfig = browsersToUse.find(b => b.name === variantWithBrowser.browser);
            adapterToUse = await getBrowserAdapter(variantWithBrowser.browser, browserConfig?.options);
          } else {
            // Fallback to first browser if no browser specified
            const firstBrowser = browsersToUse[0];
            adapterToUse = await getBrowserAdapter(firstBrowser.name, firstBrowser.options);
          }
          
          const result = await adapterToUse.capture({
            id,
            url: variant.url,
            screenshotTarget: variant.screenshotTarget,
            viewport: variant.viewport,
          });
          
          // Write screenshot immediately to disk instead of keeping in memory
          const finalPath = join(outDir, `${result.meta.id}.png`);
          const tmpPath = `${finalPath}.tmp`;
          tempFiles.push(tmpPath);
          
          try {
            await writeFile(tmpPath, result.buffer);
            await import("fs/promises").then(m => m.rename(tmpPath, finalPath)).catch(async () => {
              await writeFile(finalPath, result.buffer);
            });
            
            // Remove from temp files on success
            const index = tempFiles.indexOf(tmpPath);
            if (index > -1) tempFiles.splice(index, 1);
            
            captureResults.push({ id, result: { ...result, buffer: new Uint8Array(0) } }); // Empty buffer
          } catch (writeError) {
            throw writeError;
          }
        } catch (e) {
          const message = (e as Error)?.message ?? String(e);
          log.error(`Capture failed for ${id}: ${message}`);
          captureResults.push({ id, error: message });
        } finally {
          active--;
        }
      };

      const schedule = async (variant: TestCaseInstance) => {
        while (active >= maxConcurrency) {
          await Promise.race(queue);
        }
        active++;
        const p = runCapture(variant).finally(() => {
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
      log.info(`Cleaning up ${tempFiles.length} temporary files due to failure`);
      await cleanupTempFiles(tempFiles);
    }
    throw error;
  } finally {
    // Ensure adapters are torn down regardless of capture/write outcomes
    await Promise.all(Array.from(browserAdapters.values()).map(adapter => adapter.dispose?.()));
    await testCaseAdapter.stop?.();
  }

  // Screenshots are already written to disk during capture

  if (mode === "test") {
    // Compare current screenshots with the base directory and report
    const results = await compareBaseAndCurrentWithTestCases(options, cases);

    const passed = results.filter(r => r.match).length;
    const failedCaptures = captureResults.filter(r => r.error).length;
    const failedDiffs = results.filter(r => !r.match && r.reason === "pixel-diff").length;
    const failedMissingCurrent = results.filter(r => !r.match && r.reason === "missing-current").length;
    const failedMissingBase = results.filter(r => !r.match && r.reason === "missing-base").length;
    const failedErrors = results.filter(r => !r.match && r.reason === "error").length;

    // Log results for each story
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

    // Collect detailed failure information
    const failures = results
      .filter(r => !r.match)
      .map(r => ({
        id: r.id,
        reason: r.reason,
        diffPercentage: r.diffPercentage,
      }));

    const captureFailures = captureResults
      .filter(r => r.error)
      .map(r => ({
        id: r.id,
        error: r.error!,
      }));

    return { outcome, failures, captureFailures };
  } else {
    // update mode: summarize capture outcomes
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
      .map(r => ({
        id: r.id,
        error: r.error!,
      }));

    return { outcome, captureFailures };
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempFiles: string[]): Promise<void> {
  const cleanupPromises = tempFiles.map(async (file) => {
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
