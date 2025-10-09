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
}

// New function after tool agnostic design
export async function runVisualTests(
  options: Partial<VisualTestingToolConfig> = {}
): Promise<TestResult> {
  const effectiveConfig = await resolveEffectiveConfig(options);

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
  return { success, outcome, exitCode, failures, captureFailures };
}
