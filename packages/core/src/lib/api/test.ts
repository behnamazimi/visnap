import { DEFAULT_DOCKER_IMAGE } from "@/constants";
import { launchBrowser, openPage } from "@/lib/browser";
import {
  resolveBrowsers,
  resolveFinalConfig,
  type BrowserName,
  type ViewportConfig,
} from "@/lib/config";
import {
  processBrowserForTest,
  type BrowserTestResult,
} from "@/lib/test-service";
import { runInDockerWithConfig } from "@/utils/docker";
import {
  ensureVttDirectories,
  clearDirectoryFiles,
  getCurrentDir,
} from "@/utils/fs";
import log from "@/utils/logger";
import {
  createEmptyReport,
  appendBrowserResults,
  writeJsonReport,
} from "@/utils/report";
import { globalBrowserManager } from "@/utils/resource-cleanup";
import { getStorybookUrl } from "@/utils/server";
import {
  extractStories,
  normalizeStories,
  waitForStorybookReady,
} from "@/utils/story-utils";

// High-level API types
interface BaseOptions {
  /** Include patterns for stories (overrides config) */
  include?: string[];
  /** Exclude patterns for stories (overrides config) */
  exclude?: string[];
  /** Browsers to test (overrides config) */
  browsers?: BrowserName[];
  /** Viewport configuration (overrides config) */
  viewport?: ViewportConfig;
  /** Dry run - don't take screenshots */
  dryRun?: boolean;
  /** Use Docker for execution */
  useDocker?: boolean;
  /** Output JSON report to file */
  jsonReport?: string | boolean;
}

export type TestOptions = BaseOptions;

export interface TestResult {
  /** Whether all tests passed */
  passed: boolean;
  /** Results per browser */
  browserResults: BrowserTestResult[];
  /** Total stories tested */
  totalStories: number;
  /** Total stories that passed */
  passedStories: number;
  /** Exit code (0 = success, 3 = diffs found) */
  exitCode: number;
}

/**
 * Run visual regression tests
 */
export async function runTests(options: TestOptions = {}): Promise<TestResult> {
  const {
    include,
    exclude,
    browsers,
    viewport,
    dryRun = false,
    jsonReport,
    useDocker = false,
  } = options;

  // Resolve final configuration (config file → process args → function options)
  const effectiveConfig = await resolveFinalConfig({
    include,
    exclude,
    browser: browsers,
    viewport,
    dryRun,
    jsonReport,
    useDocker,
  });

  // Handle Docker execution
  if (effectiveConfig.useDocker) {
    const status = runInDockerWithConfig({
      image: process.env.VTT_DOCKER_IMAGE || DEFAULT_DOCKER_IMAGE,
      config: effectiveConfig,
      command: "test",
    });

    return {
      passed: status === 0,
      browserResults: [],
      totalStories: 0,
      passedStories: 0,
      exitCode: status,
    };
  }

  log.success("Successfully loaded visual-testing-tool.config");

  // Start Storybook server
  const sb = await getStorybookUrl();
  if (!sb) {
    throw new Error(
      "Failed to serve storybook build output. Ensure you have a valid source in visual-testing-tool.config"
    );
  }

  log.info(`Storybook ready at ${sb.url}`);

  // Prepare directories
  ensureVttDirectories(effectiveConfig);
  await clearDirectoryFiles(getCurrentDir(effectiveConfig));

  const testBrowsers: BrowserName[] =
    browsers || resolveBrowsers(effectiveConfig);
  const allResults: BrowserTestResult[] = [];
  const report = await createEmptyReport();

  // Collect all stories once for comparison
  const browserInstance = await launchBrowser("chromium");
  const bootstrapPage = await openPage(browserInstance, sb.url);
  await waitForStorybookReady(bootstrapPage);
  const rawStories = await extractStories(bootstrapPage);
  const allStories = normalizeStories(rawStories);

  // Explicitly close bootstrap browser when done
  await bootstrapPage.close();
  await browserInstance.close();
  globalBrowserManager.removePage(bootstrapPage);
  globalBrowserManager.removeBrowser(browserInstance);

  // Process each browser
  for (const browserName of testBrowsers) {
    const result = await processBrowserForTest(
      browserName,
      sb.url,
      effectiveConfig,
      allStories,
      { include, exclude, dryRun }
    );

    allResults.push(result);
    appendBrowserResults(report, browserName, result.results);
  }

  // Cleanup
  if (sb.server) sb.server.close();

  // Calculate totals
  const totalStories = allResults.reduce((sum, r) => sum + r.total, 0);
  const passedStories = allResults.reduce((sum, r) => sum + r.passed, 0);
  const allPassed = allResults.every(r => r.passed === r.total);
  const exitCode = allPassed ? 0 : 3;

  // Write JSON report if requested
  if (jsonReport) {
    const path =
      typeof jsonReport === "string"
        ? jsonReport
        : "visual-testing-tool-report.json";
    await writeJsonReport(path, report);
  }

  return {
    passed: allPassed,
    browserResults: allResults,
    totalStories,
    passedStories,
    exitCode,
  };
}
