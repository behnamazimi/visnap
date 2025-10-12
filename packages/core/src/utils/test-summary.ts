import type {
  VisualTestingToolConfig,
  TestCaseInstanceMeta,
  ScreenshotResult,
  RunOutcome,
  TestCaseDetail,
  TestDurations,
  BrowserName,
} from "@vividiff/protocol";

import log from "./logger";

import { compareBaseAndCurrentWithTestCases } from "@/lib/compare";

/**
 * Summarize test mode results with comparison and logging
 */
export async function summarizeTestMode(
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

  // Build TestCaseDetail array by combining capture and comparison results
  const testCases: TestCaseDetail[] = [];
  let totalCaptureDurationMs = 0;
  let totalComparisonDurationMs = 0;

  // Create a map of comparison results by ID for quick lookup
  // Strip .png extension from comparison result IDs to match capture result IDs
  const comparisonResultsMap = new Map(
    results.map(r => [r.id.replace(/\.png$/, ""), r])
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
    const totalDurationMs =
      Math.round((captureDurationMs + comparisonDurationMs) * 100) / 100;

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
    const viewport = testCase?.viewport
      ? `${testCase.viewport.width}x${testCase.viewport.height}${testCase.viewport.deviceScaleFactor ? `@${testCase.viewport.deviceScaleFactor}x` : ""}`
      : undefined;

    testCases.push({
      id: captureResult.id,
      captureFilename:
        captureResult.captureFilename || `${captureResult.id}.png`,
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
    totalCaptureDurationMs: Math.round(totalCaptureDurationMs * 100) / 100,
    totalComparisonDurationMs:
      Math.round(totalComparisonDurationMs * 100) / 100,
    totalDurationMs:
      Math.round((totalCaptureDurationMs + totalComparisonDurationMs) * 100) /
      100,
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

/**
 * Summarize update mode results (no comparison, just capture success/failure)
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
    const viewport = testCase?.viewport
      ? `${testCase.viewport.width}x${testCase.viewport.height}${testCase.viewport.deviceScaleFactor ? `@${testCase.viewport.deviceScaleFactor}x` : ""}`
      : undefined;

    testCases.push({
      id: captureResult.id,
      captureFilename:
        captureResult.captureFilename || `${captureResult.id}.png`,
      captureDurationMs: Math.round(captureDurationMs * 100) / 100,
      totalDurationMs: Math.round(captureDurationMs * 100) / 100, // No comparison in update mode
      status,
      reason: captureResult.error,
      title: testCase?.title,
      kind: testCase?.kind,
      browser: testCase?.browser,
      viewport,
    });
  }

  const durations: TestDurations = {
    totalCaptureDurationMs: Math.round(totalCaptureDurationMs * 100) / 100,
    totalComparisonDurationMs: 0, // No comparison in update mode
    totalDurationMs: Math.round(totalCaptureDurationMs * 100) / 100,
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
