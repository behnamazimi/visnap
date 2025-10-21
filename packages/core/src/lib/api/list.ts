import type {
  VisualTestingToolConfig,
  TestCaseInstanceMeta,
  BrowserName,
} from "@visnap/protocol";

import {
  loadBrowserAdapter,
  loadAllTestCaseAdapters,
  BrowserAdapterPool,
} from "@/browser/adapter-loader";
import { parseBrowsersFromConfig } from "@/browser/browser-config";
import { resolveEffectiveConfig } from "@/lib/config";
import { discoverCasesFromAllAdapters } from "@/test/test-discovery";
import log from "@/utils/logger";

export interface ListResult {
  testCases: (TestCaseInstanceMeta & { browser: BrowserName })[];
  summary: {
    total: number;
    browsers: string[];
    viewports: string[];
  };
}

/**
 * Internal function that discovers test cases with optional CLI overrides.
 * @param options - Configuration options for test case discovery
 * @param cliOptions - CLI-specific options for filtering and config path
 * @returns List of discovered test cases with summary statistics
 */
async function listTestCasesInternal(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: {
    include?: string | string[];
    exclude?: string | string[];
    configPath?: string;
  }
): Promise<ListResult> {
  const effectiveConfig = await resolveEffectiveConfig(options, cliOptions);

  const testCaseAdapters = await loadAllTestCaseAdapters(
    effectiveConfig.adapters
  );
  const browsers = parseBrowsersFromConfig(effectiveConfig.adapters);

  // Use browser adapter pool for proper resource management
  const browserAdapterPool = new BrowserAdapterPool();

  const getBrowserAdapter = async (
    browserName: BrowserName,
    browserOptions?: Record<string, unknown>
  ) => {
    return browserAdapterPool.getAdapter(browserName, browserOptions, () =>
      loadBrowserAdapter(effectiveConfig.adapters)
    );
  };

  let testCases: (TestCaseInstanceMeta & { browser: BrowserName })[] = [];

  try {
    // Get initialized browser adapter from pool
    const browserAdapter = await getBrowserAdapter(
      browsers[0].name,
      browsers[0].options
    );

    testCases = await discoverCasesFromAllAdapters(
      testCaseAdapters,
      browserAdapter,
      effectiveConfig.viewport,
      browsers
    );
  } finally {
    // Ensure proper cleanup
    await browserAdapterPool.disposeAll();

    // Clean up test case adapters
    for (const adapter of testCaseAdapters) {
      try {
        await adapter.stop?.();
      } catch (error) {
        log.warn(`Error stopping test case adapter ${adapter.name}: ${error}`);
      }
    }
  }

  // Extract unique browsers and viewports
  const uniqueBrowsers = new Set<string>();
  const viewports = new Set<string>();

  for (const testCase of testCases) {
    if (testCase.browser) {
      uniqueBrowsers.add(testCase.browser);
    }
    if (testCase.viewport) {
      const viewportKey = `${testCase.viewport.width}x${testCase.viewport.height}`;
      viewports.add(viewportKey);
    }
  }

  return {
    testCases,
    summary: {
      total: testCases.length,
      browsers: Array.from(uniqueBrowsers).sort(),
      viewports: Array.from(viewports).sort(),
    },
  };
}

/**
 * Discovers and lists available test cases from configured adapters.
 * @param options - Configuration options for test case discovery
 * @returns List of discovered test cases with summary statistics
 */
export async function listTestCases(
  options: Partial<VisualTestingToolConfig> = {}
): Promise<ListResult> {
  return listTestCasesInternal(options);
}

/**
 * Discovers and lists test cases with CLI-specific filtering options.
 * @param options - Configuration options for test case discovery
 * @param cliOptions - CLI options for filtering test cases
 * @returns List of discovered test cases with summary statistics
 */
export async function listTestCasesCli(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions: { include?: string | string[]; exclude?: string | string[] }
): Promise<ListResult> {
  return listTestCasesInternal(options, cliOptions);
}
