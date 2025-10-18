import type { VisualTestingToolConfig, TestResult } from "@visnap/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { executeTestRun } from "@/utils/testcase-runner";

/**
 * Internal function that runs visual tests with optional CLI overrides.
 * @param options - Configuration options for the test run
 * @param cliOptions - CLI-specific options for filtering and config path
 * @returns Test results with outcome, failures, and configuration metadata
 */
async function runVisualTestsInternal(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: {
    include?: string | string[];
    exclude?: string | string[];
    configPath?: string;
  }
): Promise<TestResult> {
  const effectiveConfig = await resolveEffectiveConfig(options, cliOptions);

  const { outcome, failures, captureFailures } = await executeTestRun(
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

/**
 * Runs visual regression tests using the provided configuration.
 * @param options - Configuration options for the test run
 * @returns Test results with outcome, failures, and configuration metadata
 */
export async function runVisualTests(
  options: Partial<VisualTestingToolConfig> = {}
): Promise<TestResult> {
  return runVisualTestsInternal(options);
}

/**
 * Runs visual regression tests with CLI-specific options.
 * @param options - Configuration options for the test run
 * @param cliOptions - CLI options for filtering test cases
 * @returns Test results with outcome, failures, and configuration metadata
 */
export async function runVisualTestsCli(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions: { include?: string | string[]; exclude?: string | string[] }
): Promise<TestResult> {
  return runVisualTestsInternal(options, cliOptions);
}
