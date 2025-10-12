import type { VisualTestingToolConfig, RunOutcome } from "@vividiff/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { runTestCasesOnBrowser } from "@/utils/testcase-runner";

export interface TestResult {
  success: boolean;
  outcome: RunOutcome;
  exitCode: number;
  failures?: Array<{
    id: string;
    reason: string;
    diffPercentage?: number;
  }>;
  captureFailures?: Array<{
    id: string;
    error: string;
  }>;
  config?: {
    screenshotDir?: string;
    adapters?: {
      browser?: { name: string; options?: Record<string, unknown> };
      testCase?: Array<{ name: string; options?: Record<string, unknown> }>;
    };
    comparison?: {
      core?: string;
      threshold?: number;
      diffColor?: string;
    };
    runtime?: {
      maxConcurrency?: number;
      quiet?: boolean;
    };
    viewport?: Record<
      string,
      { width: number; height: number; deviceScaleFactor?: number }
    >;
    reporter?: {
      html?: boolean | string;
      json?: boolean | string;
    };
  };
}

// Internal function that handles the core logic
async function runVisualTestsInternal(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: { include?: string | string[]; exclude?: string | string[] }
): Promise<TestResult> {
  const effectiveConfig = await resolveEffectiveConfig(options, cliOptions);

  const { outcome, failures, captureFailures } = await runTestCasesOnBrowser(
    effectiveConfig,
    "test"
  );
  if (!outcome) {
    throw new Error("Test run did not return outcome data");
  }
  const success =
    outcome.passed === outcome.total && outcome.captureFailures === 0;
  const exitCode = success ? 0 : 1;

  // Include configuration metadata in the result
  const config = {
    screenshotDir: effectiveConfig.screenshotDir,
    adapters: effectiveConfig.adapters,
    comparison: effectiveConfig.comparison,
    runtime: effectiveConfig.runtime,
    viewport: effectiveConfig.viewport,
    reporter: effectiveConfig.reporter,
  };

  return {
    success,
    outcome,
    exitCode,
    failures,
    captureFailures,
    config,
  };
}

// New function after tool agnostic design
export async function runVisualTests(
  options: Partial<VisualTestingToolConfig> = {}
): Promise<TestResult> {
  return runVisualTestsInternal(options);
}

// CLI-specific function that handles CLI options
export async function runVisualTestsCli(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions: { include?: string | string[]; exclude?: string | string[] }
): Promise<TestResult> {
  return runVisualTestsInternal(options, cliOptions);
}
