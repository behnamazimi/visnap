import type {
  TestCaseAdapter,
  TestCaseInstanceMeta,
  VisualTestingToolConfig,
  PageWithEvaluate,
  BrowserName,
  BrowserAdapter,
} from "@visnap/protocol";

import { type BrowserTarget } from "./browser-config";
import log from "./logger";

/**
 * Start test case adapter and resolve page URL
 */
export async function startAdapterAndResolvePageUrl(
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

/**
 * Sort test cases deterministically by caseId, then variantId
 */
export function sortCasesStable<T extends TestCaseInstanceMeta>(
  cases: T[]
): void {
  cases.sort((a, b) => {
    const caseCompare = a.caseId.localeCompare(b.caseId);
    if (caseCompare !== 0) return caseCompare;
    return a.variantId.localeCompare(b.variantId);
  });
}

/**
 * Discover test cases using the test case adapter
 */
export async function discoverCases(
  testCaseAdapter: TestCaseAdapter,
  page: PageWithEvaluate,
  viewport: VisualTestingToolConfig["viewport"]
): Promise<TestCaseInstanceMeta[]> {
  return await testCaseAdapter.listCases(page, {
    viewport,
  });
}

/**
 * Expand discovered cases for each browser configuration
 */
export function expandCasesForBrowsers(
  discoveredCases: TestCaseInstanceMeta[],
  browsers: BrowserTarget[]
): (TestCaseInstanceMeta & { browser: BrowserName })[] {
  const expanded: Array<TestCaseInstanceMeta & { browser: BrowserName }> = [];
  for (const discovered of discoveredCases) {
    for (const browser of browsers) {
      expanded.push({
        ...discovered,
        variantId: `${discovered.variantId}-${browser.name}`,
        browser: browser.name,
      });
    }
  }
  return expanded;
}

/**
 * Unified test case discovery with browser expansion
 */
export async function discoverTestCasesWithBrowsers(
  testCaseAdapter: TestCaseAdapter,
  page: PageWithEvaluate,
  viewport: VisualTestingToolConfig["viewport"],
  browsers: BrowserTarget[]
): Promise<(TestCaseInstanceMeta & { browser: BrowserName })[]> {
  // Discover test cases with global viewport configuration
  const discoveredCases = await discoverCases(testCaseAdapter, page, viewport);

  // Expand cases for each browser
  const expandedCases = expandCasesForBrowsers(discoveredCases, browsers);

  // Sort cases deterministically by caseId, then variantId
  sortCasesStable(expandedCases);

  // Convert to TestCaseInstanceMeta format with required browser property
  const testCaseMetas: (TestCaseInstanceMeta & { browser: BrowserName })[] =
    expandedCases.map(case_ => ({
      ...case_,
      id: case_.caseId,
      title: case_.title || `Test Case ${case_.caseId}`,
      kind: case_.kind || "unknown",
      parameters: case_.parameters || {},
      tags: case_.tags || [],
      visualTesting: case_.visualTesting,
      browser: case_.browser, // This is guaranteed to be present from expandCasesForBrowsers
    }));

  return testCaseMetas;
}

/**
 * Discover test cases from multiple adapters
 */
export async function discoverCasesFromAllAdapters(
  testCaseAdapters: TestCaseAdapter[],
  browserAdapter: BrowserAdapter,
  viewport: VisualTestingToolConfig["viewport"],
  browsers: BrowserTarget[]
): Promise<(TestCaseInstanceMeta & { browser: BrowserName })[]> {
  const allCases: (TestCaseInstanceMeta & { browser: BrowserName })[] = [];

  for (
    let adapterIndex = 0;
    adapterIndex < testCaseAdapters.length;
    adapterIndex++
  ) {
    const adapter = testCaseAdapters[adapterIndex];

    try {
      // Start adapter and resolve page URL
      const pageUrl = await startAdapterAndResolvePageUrl(adapter);

      // Open page for this adapter
      if (!browserAdapter.openPage) {
        throw new Error("Browser adapter does not support openPage method");
      }

      const page = (await browserAdapter.openPage(
        pageUrl
      )) as unknown as PageWithEvaluate;

      try {
        // Discover test cases with global viewport configuration
        const discoveredCases = await discoverCases(adapter, page, viewport);

        // Expand cases for each browser
        const expandedCases = expandCasesForBrowsers(discoveredCases, browsers);

        // Add adapter prefix to case IDs to avoid conflicts
        const prefixedCases = expandedCases.map(case_ => ({
          ...case_,
          caseId: `${adapter.name}-${case_.caseId}`,
          id: `${adapter.name}-${case_.caseId}`,
        }));

        allCases.push(...prefixedCases);
      } finally {
        // Close the page
        await page?.close?.();
      }
    } catch (error) {
      log.warn(
        `Error discovering cases from adapter ${adapter.name}: ${error}`
      );
      // Continue with other adapters
    }
  }

  // Sort cases deterministically by caseId, then variantId
  sortCasesStable(allCases);

  return allCases;
}
