/**
 * @fileoverview Update mode summary functionality
 */

import type {
  TestCaseInstanceMeta,
  ScreenshotResult,
  RunOutcome,
  TestCaseDetail,
  TestDurations,
  BrowserName,
} from "@visnap/protocol";

import { roundToTwoDecimals } from "@/utils/math";
import { formatViewport } from "@/utils/viewport-formatting";

/**
 * Summarizes update mode results (no comparison, just capture success/failure).
 * @param captureResults - Results from screenshot capture operations
 * @param cases - Optional test case instances with browser information
 * @returns Test outcome with capture failures
 */
export function summarizeUpdateMode(
  captureResults: {
    id: string;
    result?: ScreenshotResult;
    error?: string;
    captureDurationMs?: number;
    captureFilename?: string;
  }[],
  cases?: (TestCaseInstanceMeta & { browser: BrowserName })[]
): {
  outcome: RunOutcome;
  captureFailures: Array<{ id: string; error: string }>;
} {
  const total = captureResults.length;
  const successful = captureResults.filter(r => r.result).length;
  const failedCaptures = captureResults.filter(r => r.error).length;

  // Build TestCaseDetail array for update mode
  const testCases: TestCaseDetail[] = [];
  let totalCaptureDurationMs = 0;

  // Create a map of test cases by ID for metadata lookup
  const testCasesMap = cases
    ? new Map(cases.map(c => [`${c.caseId}-${c.variantId}`, c]))
    : new Map();

  for (const captureResult of captureResults) {
    const testCase = testCasesMap.get(captureResult.id);
    const captureDurationMs = captureResult.captureDurationMs || 0;
    totalCaptureDurationMs += captureDurationMs;

    const status: "passed" | "failed" | "capture-failed" = captureResult.error
      ? "capture-failed"
      : "passed";

    // Format viewport information
    const viewport = formatViewport(testCase?.viewport);

    testCases.push({
      id: captureResult.id,
      captureFilename:
        captureResult.captureFilename || `${captureResult.id}.png`,
      captureDurationMs: roundToTwoDecimals(captureDurationMs),
      totalDurationMs: roundToTwoDecimals(captureDurationMs), // No comparison in update mode
      status,
      reason: captureResult.error,
      title: testCase?.title,
      kind: testCase?.kind,
      browser: testCase?.browser,
      viewport,
    });
  }

  const durations: TestDurations = {
    totalCaptureDurationMs: roundToTwoDecimals(totalCaptureDurationMs),
    totalComparisonDurationMs: 0, // No comparison in update mode
    totalDurationMs: roundToTwoDecimals(totalCaptureDurationMs),
  };

  const outcome: RunOutcome = {
    total,
    passed: successful,
    failedDiffs: 0,
    failedMissingCurrent: 0,
    failedMissingBase: 0,
    failedErrors: 0,
    captureFailures: failedCaptures,
    testCases,
    durations,
  };

  const captureFailures = captureResults
    .filter(r => r.error)
    .map(r => ({ id: r.id, error: r.error! }));

  return { outcome, captureFailures };
}
