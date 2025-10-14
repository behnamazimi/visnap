import type {
  VisualTestingToolConfig,
  TestCaseInstanceMeta,
  BrowserName,
} from "@visnap/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { discoverTestCases } from "@/utils/testcase-runner";

export interface ListResult {
  testCases: (TestCaseInstanceMeta & { browser: BrowserName })[];
  summary: {
    total: number;
    browsers: string[];
    viewports: string[];
  };
}

// Internal function that handles the core logic
async function listTestCasesInternal(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: { include?: string | string[]; exclude?: string | string[] }
): Promise<ListResult> {
  const effectiveConfig = await resolveEffectiveConfig(options, cliOptions);

  const testCases = await discoverTestCases(effectiveConfig);

  // Extract unique browsers and viewports
  const browsers = new Set<string>();
  const viewports = new Set<string>();

  for (const testCase of testCases) {
    if (testCase.browser) {
      browsers.add(testCase.browser);
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
      browsers: Array.from(browsers).sort(),
      viewports: Array.from(viewports).sort(),
    },
  };
}

// New function after tool agnostic design
export async function listTestCases(
  options: Partial<VisualTestingToolConfig> = {}
): Promise<ListResult> {
  return listTestCasesInternal(options);
}

// CLI-specific function that handles CLI options
export async function listTestCasesCli(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions: { include?: string | string[]; exclude?: string | string[] }
): Promise<ListResult> {
  return listTestCasesInternal(options, cliOptions);
}
