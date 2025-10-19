/**
 * @fileoverview Test mode summary functionality
 */

import type {
  StorageAdapter,
  VisualTestingToolConfig,
  TestCaseInstanceMeta,
  ScreenshotResult,
  RunOutcome,
  TestCaseDetail,
  TestDurations,
  BrowserName,
} from "@visnap/protocol";
import { SNAPSHOT_EXTENSION } from "@visnap/protocol";

import { compareTestCases } from "@/comparison/compare";
import log from "@/utils/logger";
import { roundToTwoDecimals } from "@/utils/math";
import { formatViewport } from "@/utils/viewport-formatting";

/**
 * Summarizes test mode results with comparison and logging.
 * @param storage - Storage adapter for accessing image files
 * @param options - Visual testing tool configuration
 * @param cases - Test case instances with browser information
 * @param captureResults - Results from screenshot capture operations
 * @returns Test outcome with failures and capture failures
 */
export async function summarizeTestMode(
  storage: StorageAdapter,
  options: VisualTestingToolConfig,
  cases: (TestCaseInstanceMeta & { browser: BrowserName })[],
  captureResults: {
    id: string;
    result?: ScreenshotResult;
    error?: string;
    captureDurationMs?: number;
    captureFilename?: string;
  }[]
): Promise<{
  outcome: RunOutcome;
  failures: Array<{ id: string; reason: string; diffPercentage?: number }>;
  captureFailures: Array<{ id: string; error: string }>;
}> {
  const results = await compareTestCases(storage, options, cases);

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

  // Build TestCaseDetail array by combining capture and comparison results
  const testCases: TestCaseDetail[] = [];
  let totalCaptureDurationMs = 0;
  let totalComparisonDurationMs = 0;

  // Create a map of comparison results by ID for quick lookup
  // Strip snapshot extension from comparison result IDs to match capture result IDs
  const comparisonResultsMap = new Map(
    results.map(r => [
      r.id.replace(
        new RegExp(`${SNAPSHOT_EXTENSION.replace(".", "\\.")}$`),
        ""
      ),
      r,
    ])
  );

  // Create a map of test cases by ID for metadata lookup
  const testCasesMap = new Map(
    cases.map(c => [`${c.caseId}-${c.variantId}`, c])
  );

  for (const captureResult of captureResults) {
    const comparisonResult = comparisonResultsMap.get(captureResult.id);
    const testCase = testCasesMap.get(captureResult.id);
    const captureDurationMs = captureResult.captureDurationMs || 0;
    const comparisonDurationMs = comparisonResult?.comparisonDurationMs || 0;
    const totalDurationMs = roundToTwoDecimals(
      captureDurationMs + comparisonDurationMs
    );

    totalCaptureDurationMs += captureDurationMs;
    totalComparisonDurationMs += comparisonDurationMs;

    let status: "passed" | "failed" | "capture-failed";
    let reason: string | undefined;
    let diffPercentage: number | undefined;

    if (captureResult.error) {
      status = "capture-failed";
      reason = captureResult.error;
    } else if (comparisonResult) {
      if (comparisonResult.match) {
        status = "passed";
      } else {
        status = "failed";
        reason = comparisonResult.reason;
        diffPercentage = comparisonResult.diffPercentage;
      }
    } else {
      status = "failed";
      reason = "missing-comparison-result";
    }

    // Format viewport information
    const viewport = formatViewport(testCase?.viewport);

    testCases.push({
      id: captureResult.id,
      captureFilename:
        captureResult.captureFilename ||
        `${captureResult.id}${SNAPSHOT_EXTENSION}`,
      captureDurationMs,
      comparisonDurationMs: comparisonDurationMs || undefined,
      totalDurationMs,
      status,
      reason,
      diffPercentage,
      title: testCase?.title,
      kind: testCase?.kind,
      browser: testCase?.browser,
      viewport,
    });
  }

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

  const durations: TestDurations = {
    totalCaptureDurationMs: roundToTwoDecimals(totalCaptureDurationMs),
    totalComparisonDurationMs: roundToTwoDecimals(totalComparisonDurationMs),
    totalDurationMs: roundToTwoDecimals(
      totalCaptureDurationMs + totalComparisonDurationMs
    ),
  };

  const outcome: RunOutcome = {
    total: results.length,
    passed,
    failedDiffs,
    failedMissingCurrent,
    failedMissingBase,
    failedErrors,
    captureFailures: failedCaptures,
    testCases,
    durations,
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
