import type { TestCaseDetail } from "@visnap/protocol";
import { describe, it, expect } from "vitest";

import {
  createMockTestCaseDetail,
  createMockRunOutcome,
  createMockTestResult,
} from "../__mocks__";

import { serializeTestData } from "./data-serializer";

describe("serializeTestData", () => {
  it("should serialize basic test result data", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", status: "passed" }),
      createMockTestCaseDetail({ id: "test-2", status: "passed" }),
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.success).toBe(true);
    expect(result.outcome).toEqual(testResult.outcome);
    expect(result.failures).toEqual([]);
    expect(result.captureFailures).toEqual([]);
    expect(result.timestamp).toBeDefined();
    expect(result.config).toEqual(testResult.config);
    expect(result.duration).toBe(testResult.outcome.durations?.totalDurationMs);
    expect(result.testCases).toEqual(testResult.outcome.testCases);
  });

  it("should extract unique browsers from test cases", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", browser: "chrome" }),
      createMockTestCaseDetail({ id: "test-2", browser: "firefox" }),
      createMockTestCaseDetail({
        id: "test-3",
        status: "failed",
        browser: "chrome",
        reason: "pixel-diff",
      }),
      createMockTestCaseDetail({ id: "test-4", browser: "safari" }),
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.browsers).toEqual(["chrome", "firefox", "safari"]);
  });

  it("should handle test cases without browser information", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", browser: undefined }),
      createMockTestCaseDetail({ id: "test-2", browser: "chrome" }),
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.browsers).toEqual(["N/A", "chrome"]);
  });

  it("should extract unique viewports from test cases", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", viewport: "1920x1080" }),
      createMockTestCaseDetail({ id: "test-2", viewport: "1366x768" }),
      createMockTestCaseDetail({ id: "test-3", viewport: "mobile" }),
      createMockTestCaseDetail({ id: "test-4", viewport: "1920x1080" }),
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["1920x1080", "1366x768", "mobile"]);
  });

  it("should handle viewport objects with missing dimensions", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", viewport: "1920x1080" }),
      createMockTestCaseDetail({ id: "test-2", viewport: "1366x768" }),
      createMockTestCaseDetail({ id: "test-3", viewport: "1024x768" }),
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["1920x1080", "1366x768", "1024x768"]);
  });

  it("should handle test cases without viewport information", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", viewport: undefined }),
      createMockTestCaseDetail({ id: "test-2", viewport: "1920x1080" }),
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["N/A", "1920x1080"]);
  });

  it("should handle viewport with only width", () => {
    const testCases: TestCaseDetail[] = [
      {
        ...createMockTestCaseDetail({ id: "test-1" }),
        viewport: { width: 1920 } as any,
      },
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["N/A"]);
  });

  it("should handle viewport with only height", () => {
    const testCases: TestCaseDetail[] = [
      {
        ...createMockTestCaseDetail({ id: "test-1" }),
        viewport: { height: 1080 } as any,
      },
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["N/A"]);
  });

  it("should handle viewport with falsy width", () => {
    const testCases: TestCaseDetail[] = [
      {
        ...createMockTestCaseDetail({ id: "test-1" }),
        viewport: { width: 0, height: 1080 } as any,
      },
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["N/A"]);
  });

  it("should handle viewport with falsy height", () => {
    const testCases: TestCaseDetail[] = [
      {
        ...createMockTestCaseDetail({ id: "test-1" }),
        viewport: { width: 1920, height: 0 } as any,
      },
    ];
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.viewports).toEqual(["N/A"]);
  });

  it("should count status occurrences", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", status: "passed" }),
      createMockTestCaseDetail({ id: "test-2", status: "passed" }),
      createMockTestCaseDetail({
        id: "test-3",
        status: "failed",
        reason: "pixel-diff",
      }),
      createMockTestCaseDetail({ id: "test-4", status: "capture-failed" }),
      createMockTestCaseDetail({
        id: "test-5",
        status: "failed",
        reason: "pixel-diff",
      }),
    ];
    const testResult = createMockTestResult({
      success: false,
      exitCode: 1,
      outcome: createMockRunOutcome(testCases),
    });

    const result = serializeTestData(testResult);

    expect(result.statusCounts).toEqual({
      passed: 2,
      failed: 2,
      "capture-failed": 1,
    });
  });

  it("should group test cases by status", () => {
    const testCases = [
      createMockTestCaseDetail({ id: "test-1", status: "passed" }),
      createMockTestCaseDetail({
        id: "test-2",
        status: "failed",
        reason: "pixel-diff",
      }),
      createMockTestCaseDetail({ id: "test-3", status: "passed" }),
      createMockTestCaseDetail({ id: "test-4", status: "capture-failed" }),
    ];
    const testResult = createMockTestResult({
      success: false,
      exitCode: 1,
      outcome: createMockRunOutcome(testCases),
    });

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
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome([]),
    });

    const result = serializeTestData(testResult);

    expect(result.testCases).toEqual([]);
    expect(result.browsers).toEqual([]);
    expect(result.viewports).toEqual([]);
    expect(result.statusCounts).toEqual({});
    expect(result.groupedByStatus).toEqual({});
  });

  it("should handle undefined test cases", () => {
    const testResult = createMockTestResult({
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
    });

    const result = serializeTestData(testResult);

    expect(result.testCases).toEqual([]);
    expect(result.browsers).toEqual([]);
    expect(result.viewports).toEqual([]);
    expect(result.statusCounts).toEqual({});
    expect(result.groupedByStatus).toEqual({});
  });

  it("should include timestamp in the result", () => {
    const testResult = createMockTestResult({
      outcome: createMockRunOutcome([]),
    });

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
