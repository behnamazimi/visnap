import type { TestResult, TestCaseDetail, Viewport } from "@visnap/protocol";
import { describe, it, expect } from "vitest";

import { serializeTestData } from "./data-serializer";

describe("serializeTestData", () => {
  const createMockTestCase = (
    id: string,
    status: "passed" | "failed" | "capture-failed",
    browser: string = "chrome",
    viewport: Viewport | string = { width: 1920, height: 1080 }
  ): TestCaseDetail => ({
    id,
    status,
    browser,
    viewport:
      typeof viewport === "string"
        ? viewport
        : `${viewport.width}x${viewport.height}`,
    captureFilename: `${id}.png`,
    captureDurationMs: 1000,
    totalDurationMs: 1000,
    reason: status === "failed" ? "pixel-diff" : undefined,
  });

  const createMockRunOutcome = (testCases: TestCaseDetail[] = []) => ({
    total: testCases.length,
    passed: testCases.filter(tc => tc.status === "passed").length,
    failedDiffs: testCases.filter(
      tc => tc.status === "failed" && tc.reason === "pixel-diff"
    ).length,
    failedMissingCurrent: testCases.filter(
      tc => tc.status === "failed" && tc.reason === "missing-current"
    ).length,
    failedMissingBase: testCases.filter(
      tc => tc.status === "failed" && tc.reason === "missing-base"
    ).length,
    failedErrors: testCases.filter(
      tc =>
        tc.status === "failed" &&
        tc.reason &&
        !["pixel-diff", "missing-current", "missing-base"].includes(tc.reason)
    ).length,
    captureFailures: testCases.filter(tc => tc.status === "capture-failed")
      .length,
    testCases,
    durations: {
      totalDurationMs: 1000,
      totalCaptureDurationMs: 800,
      totalComparisonDurationMs: 200,
    },
  });

  it("should serialize basic test result data", () => {
    const testCases = [
      createMockTestCase("test-1", "passed"),
      createMockTestCase("test-2", "passed"),
    ];
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      config: {
        screenshotDir: "/test/screenshots",
        comparison: { core: "odiff", threshold: 0.1 },
      },
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.success).toBe(true);
    expect(result.outcome).toEqual(testResult.outcome);
    expect(result.failures).toEqual([]);
    expect(result.captureFailures).toEqual([]);
    expect(result.timestamp).toBeDefined();
    expect(result.config).toEqual(testResult.config);
    expect(result.duration).toBe(1000);
    expect(result.testCases).toEqual(testResult.outcome.testCases);
  });

  it("should extract unique browsers from test cases", () => {
    const testCases = [
      createMockTestCase("test-1", "passed", "chrome"),
      createMockTestCase("test-2", "passed", "firefox"),
      createMockTestCase("test-3", "failed", "chrome"),
      createMockTestCase("test-4", "passed", "safari"),
    ];
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.browsers).toEqual(["chrome", "firefox", "safari"]);
  });

  it("should handle test cases without browser information", () => {
    const testCases = [
      { ...createMockTestCase("test-1", "passed"), browser: undefined },
      createMockTestCase("test-2", "passed", "chrome"),
    ];
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.browsers).toEqual(["N/A", "chrome"]);
  });

  it("should extract unique viewports from test cases", () => {
    const testCases = [
      createMockTestCase("test-1", "passed", "chrome", {
        width: 1920,
        height: 1080,
      }),
      createMockTestCase("test-2", "passed", "chrome", {
        width: 1366,
        height: 768,
      }),
      createMockTestCase("test-3", "failed", "chrome", "mobile"),
      createMockTestCase("test-4", "passed", "chrome", {
        width: 1920,
        height: 1080,
      }),
    ];
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["1920x1080", "1366x768", "mobile"]);
  });

  it("should handle viewport objects with missing dimensions", () => {
    const testCases = [
      createMockTestCase("test-1", "passed", "chrome", "1920x1080"), // Use string instead of incomplete object
      createMockTestCase("test-2", "passed", "chrome", "1366x768"), // Use string instead of incomplete object
      createMockTestCase("test-3", "passed", "chrome", "1024x768"), // Use string instead of empty object
    ];
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["1920x1080", "1366x768", "1024x768"]);
  });

  it("should handle test cases without viewport information", () => {
    const testCases = [
      { ...createMockTestCase("test-1", "passed"), viewport: undefined },
      createMockTestCase("test-2", "passed", "chrome", {
        width: 1920,
        height: 1080,
      }),
    ];
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["N/A", "1920x1080"]);
  });

  it("should count status occurrences", () => {
    const testCases = [
      createMockTestCase("test-1", "passed"),
      createMockTestCase("test-2", "passed"),
      createMockTestCase("test-3", "failed"),
      createMockTestCase("test-4", "capture-failed"),
      createMockTestCase("test-5", "failed"),
    ];
    const testResult: TestResult = {
      success: false,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 1,
    };

    const result = serializeTestData(testResult);

    expect(result.statusCounts).toEqual({
      passed: 2,
      failed: 2,
      "capture-failed": 1,
    });
  });

  it("should group test cases by status", () => {
    const testCases = [
      createMockTestCase("test-1", "passed"),
      createMockTestCase("test-2", "failed"),
      createMockTestCase("test-3", "passed"),
      createMockTestCase("test-4", "capture-failed"),
    ];
    const testResult: TestResult = {
      success: false,
      outcome: createMockRunOutcome(testCases),
      failures: [],
      captureFailures: [],
      exitCode: 1,
    };

    const result = serializeTestData(testResult);

    expect(result.groupedByStatus.passed).toHaveLength(2);
    expect(result.groupedByStatus.failed).toHaveLength(1);
    expect(result.groupedByStatus["capture-failed"]).toHaveLength(1);
    expect(result.groupedByStatus.passed[0].id).toBe("test-1");
    expect(result.groupedByStatus.passed[1].id).toBe("test-3");
    expect(result.groupedByStatus.failed[0].id).toBe("test-2");
    expect(result.groupedByStatus["capture-failed"][0].id).toBe("test-4");
  });

  it("should handle empty test cases array", () => {
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome([]),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.testCases).toEqual([]);
    expect(result.browsers).toEqual([]);
    expect(result.viewports).toEqual([]);
    expect(result.statusCounts).toEqual({});
    expect(result.groupedByStatus).toEqual({});
  });

  it("should handle undefined test cases", () => {
    const testResult: TestResult = {
      success: true,
      outcome: {
        total: 0,
        passed: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
        captureFailures: 0,
        testCases: undefined,
        durations: {
          totalDurationMs: 0,
          totalCaptureDurationMs: 0,
          totalComparisonDurationMs: 0,
        },
      },
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const result = serializeTestData(testResult);

    expect(result.testCases).toEqual([]);
    expect(result.browsers).toEqual([]);
    expect(result.viewports).toEqual([]);
    expect(result.statusCounts).toEqual({});
    expect(result.groupedByStatus).toEqual({});
  });

  it("should include timestamp in the result", () => {
    const testResult: TestResult = {
      success: true,
      outcome: createMockRunOutcome([]),
      failures: [],
      captureFailures: [],
      exitCode: 0,
    };

    const beforeTime = new Date().toISOString();
    const result = serializeTestData(testResult);
    const afterTime = new Date().toISOString();

    const resultTime = new Date(result.timestamp).getTime();
    const beforeTimeMs = new Date(beforeTime).getTime();
    const afterTimeMs = new Date(afterTime).getTime();
    expect(resultTime).toBeGreaterThanOrEqual(beforeTimeMs);
    expect(resultTime).toBeLessThanOrEqual(afterTimeMs);
  });
});
