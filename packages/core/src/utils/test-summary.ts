import type {
  VisualTestingToolConfig,
  TestCaseInstance,
  ScreenshotResult,
  RunOutcome,
} from "@vividiff/protocol";

import log from "./logger";

import { compareBaseAndCurrentWithTestCases } from "@/lib/compare";

/**
 * Summarize test mode results with comparison and logging
 */
export async function summarizeTestMode(
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
      log.success(`Passed: ${r.id}`, true);
    } else {
      const reasonText = r.diffPercentage
        ? `${r.reason} (${r.diffPercentage}% difference)`
        : r.reason;
      log.error(`Failed: ${r.id} >> ${reasonText}`, true);
    }
  }

  if (failedCaptures > 0) {
    log.warn(`Capture failures: ${failedCaptures}`);
  }

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

/**
 * Summarize update mode results (no comparison, just capture success/failure)
 */
export function summarizeUpdateMode(
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
