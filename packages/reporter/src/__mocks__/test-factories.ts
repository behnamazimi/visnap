/**
 * @fileoverview Mock factory functions for creating test data for reporter tests
 */

import type {
  TestResult,
  TestCaseDetail,
  RunOutcome,
  Viewport,
} from "@visnap/protocol";

import type {
  ReportData,
  ProcessedTestCase,
  SerializedReportData,
} from "../types";

/**
 * Creates a mock TestCaseDetail with sensible defaults
 */
export function createMockTestCaseDetail(
  overrides: Partial<TestCaseDetail> = {}
): TestCaseDetail {
  return {
    id: "test-1",
    status: "passed",
    browser: "chrome",
    viewport: "1920x1080",
    captureFilename: "test-1.png",
    captureDurationMs: 1000,
    totalDurationMs: 1000,
    ...overrides,
  };
}

/**
 * Creates a mock RunOutcome with calculated values based on test cases
 */
export function createMockRunOutcome(
  testCases: TestCaseDetail[] = []
): RunOutcome {
  const passed = testCases.filter(tc => tc.status === "passed").length;
  const failedDiffs = testCases.filter(
    tc => tc.status === "failed" && tc.reason === "pixel-diff"
  ).length;
  const failedMissingCurrent = testCases.filter(
    tc => tc.status === "failed" && tc.reason === "missing-current"
  ).length;
  const failedMissingBase = testCases.filter(
    tc => tc.status === "failed" && tc.reason === "missing-base"
  ).length;
  const failedErrors = testCases.filter(
    tc =>
      tc.status === "failed" &&
      tc.reason &&
      !["pixel-diff", "missing-current", "missing-base"].includes(tc.reason)
  ).length;
  const captureFailures = testCases.filter(
    tc => tc.status === "capture-failed"
  ).length;

  return {
    total: testCases.length,
    passed,
    failedDiffs,
    failedMissingCurrent,
    failedMissingBase,
    failedErrors,
    captureFailures,
    testCases,
    durations: {
      totalDurationMs: testCases.reduce(
        (sum, tc) => sum + (tc.totalDurationMs || 0),
        0
      ),
      totalCaptureDurationMs: testCases.reduce(
        (sum, tc) => sum + (tc.captureDurationMs || 0),
        0
      ),
      totalComparisonDurationMs: testCases.reduce(
        (sum, tc) => sum + (tc.comparisonDurationMs || 0),
        0
      ),
    },
  };
}

/**
 * Creates a mock TestResult with sensible defaults
 */
export function createMockTestResult(
  overrides: Partial<TestResult> = {}
): TestResult {
  const testCases = overrides.outcome?.testCases || [];
  const outcome = overrides.outcome || createMockRunOutcome(testCases);

  return {
    success: true,
    exitCode: 0,
    outcome,
    failures: [],
    captureFailures: [],
    config: {
      screenshotDir: "/test/screenshots",
      comparison: { core: "odiff", threshold: 0.1 },
    },
    ...overrides,
  };
}

/**
 * Creates a mock ReportData with sensible defaults
 */
export function createMockReportData(
  overrides: Partial<ReportData> = {}
): ReportData {
  return {
    success: true,
    outcome: {
      total: 0,
      passed: 0,
      failedDiffs: 0,
      failedMissingCurrent: 0,
      failedMissingBase: 0,
      failedErrors: 0,
      captureFailures: 0,
      testCases: [],
      durations: {
        totalDurationMs: 1000,
        totalCaptureDurationMs: 800,
        totalComparisonDurationMs: 200,
      },
    },
    failures: [],
    captureFailures: [],
    timestamp: "2024-01-01T00:00:00.000Z",
    config: {
      screenshotDir: "/test/screenshots",
      comparison: { core: "odiff", threshold: 0.1 },
    },
    ...overrides,
  };
}

/**
 * Creates a mock ProcessedTestCase with image paths
 */
export function createMockProcessedTestCase(
  overrides: Partial<ProcessedTestCase> = {}
): ProcessedTestCase {
  const base = createMockTestCaseDetail(overrides);
  const hasDiff = base.status === "failed" && base.reason === "pixel-diff";

  return {
    ...base,
    baseImage: `./base/${base.captureFilename}`,
    currentImage: `./current/${base.captureFilename}`,
    diffImage: hasDiff ? `./diff/${base.captureFilename}` : undefined,
    ...overrides,
  };
}

/**
 * Creates a mock SerializedReportData with computed fields
 */
export function createMockSerializedReportData(
  overrides: Partial<SerializedReportData> = {}
): SerializedReportData {
  const testCases = overrides.testCases || [];
  const browsers = Array.from(
    new Set(testCases.map(tc => tc.browser || "N/A"))
  );
  const viewports = Array.from(
    new Set(
      testCases.map(tc => {
        if (!tc.viewport) return "N/A";
        if (typeof tc.viewport === "string") return tc.viewport;
        const vp = tc.viewport as Viewport;
        return vp.width && vp.height ? `${vp.width}x${vp.height}` : "N/A";
      })
    )
  );

  const statusCounts = testCases.reduce(
    (acc, tc) => {
      acc[tc.status] = (acc[tc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const groupedByStatus = testCases.reduce(
    (acc, tc) => {
      if (!acc[tc.status]) {
        acc[tc.status] = [];
      }
      acc[tc.status].push(tc);
      return acc;
    },
    {} as Record<string, typeof testCases>
  );

  return {
    ...createMockReportData(overrides),
    duration: 1000,
    testCases,
    browsers,
    viewports,
    statusCounts,
    groupedByStatus,
    ...overrides,
  };
}

/**
 * Creates a batch of test cases with different statuses for testing
 */
export function createMockTestCaseBatch(): TestCaseDetail[] {
  return [
    createMockTestCaseDetail({
      id: "test-1",
      status: "passed",
      browser: "chrome",
      viewport: "1920x1080",
    }),
    createMockTestCaseDetail({
      id: "test-2",
      status: "failed",
      browser: "firefox",
      viewport: "1366x768",
      reason: "pixel-diff",
    }),
    createMockTestCaseDetail({
      id: "test-3",
      status: "capture-failed",
      browser: "safari",
      viewport: "1024x768",
    }),
  ];
}
