import { writeFile } from "fs/promises";
import { join } from "path";

import type {
  BrowserAdapter,
  TestCaseAdapter,
  TestCaseInstance,
  VisualTestingToolConfig,
  ScreenshotResult,
  PageWithEvaluate,
} from "@visual-testing-tool/protocol";

import log from "./logger";

import { compareBaseAndCurrentWithTestCases } from "@/lib/compare";
import { ensureVttDirectories, getBaseDir, getCurrentDir } from "@/utils/fs";

// New function after tool agnostic design
export async function runTestCasesOnBrowser(
  options: VisualTestingToolConfig,
  mode: "test" | "update"
): Promise<void> {
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

  const browserAdapter = await loadBrowserAdapter();
  const testCaseAdapter = await loadTestCaseAdapter();

  let page: PageWithEvaluate | undefined;
  let cases: TestCaseInstance[] = [];
  let captureResults: { id: string; result?: ScreenshotResult; error?: string }[] = [];

  try {
    // Start browser + test-case adapter and open Storybook iframe bootstrap page
    await browserAdapter.init?.({ browser: "chromium" });
    const { baseUrl } = (await testCaseAdapter?.start?.()) ?? {};

    const bootstrapPageUrl = `${baseUrl ?? ""}/iframe.html`;
    if (!browserAdapter.openPage) {
      throw new Error("Browser adapter does not support openPage method");
    }
    page = (await browserAdapter.openPage(
      bootstrapPageUrl
    )) as unknown as PageWithEvaluate;

    // Discover and expand test cases to concrete variants
    cases = (await testCaseAdapter.listCases(
      page
    )) as unknown as TestCaseInstance[];

    captureResults = [];
    for (const variant of cases) {
      const id = `${variant.caseId}-${variant.variantId}`;
      log.dim(`Taking screenshot for: ${id}`);
      try {
        const result = await browserAdapter.capture({
          id,
          url: variant.url,
          screenshotTarget: variant.screenshotTarget,
          viewport: variant.viewport,
        });
        captureResults.push({ id, result });
      } catch (e) {
        const message = (e as Error)?.message ?? String(e);
        log.error(`Capture failed for ${id}: ${message}`);
        captureResults.push({ id, error: message });
        // continue with next variant
      }
    }
  } finally {
    // Ensure adapters are torn down regardless of capture/write outcomes
    await browserAdapter.dispose?.();
    await testCaseAdapter.stop?.();
  }

  // Prepare output directory based on mode
  ensureVttDirectories(options.screenshotDir);
  const outDir =
    mode === "test"
      ? getCurrentDir(options.screenshotDir)
      : getBaseDir(options.screenshotDir);

  // Persist all successful screenshots (every variant) in parallel and await completion
  const successful = captureResults.filter(r => r.result);
  await Promise.all(
    successful.map(r => {
      const buffer: Uint8Array = r.result!.buffer;
      const path = join(outDir, `${r.result!.meta.id}.png`);
      return writeFile(path, buffer as Uint8Array);
    })
  );

  if (mode === "test") {
    // Compare current screenshots with the base directory and report
    const results = await compareBaseAndCurrentWithTestCases(options, cases);

    const passed = results.filter(r => r.match).length;
    const failedCaptures = captureResults.filter(r => r.error).length;

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
    log.info(`Passed: ${passed} out of ${results.length}`);
  } else {
    // update mode: images written to base dir only
  }
}
