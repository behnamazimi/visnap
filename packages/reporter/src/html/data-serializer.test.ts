import { describe, it, expect } from "vitest";
import { serializeTestData } from "./data-serializer";
import type { TestResult } from "@vividiff/core";
import type { RunOutcome, TestCaseDetail } from "@vividiff/protocol";

describe("DataSerializer", () => {
  const createMockTestResult = (overrides: Partial<TestResult> = {}): TestResult => ({
    success: true,
    outcome: {
      total: 2,
      passed: 1,
      failed: 1,
      failedDiffs: 1,
      failedMissingCurrent: 0,
      failedMissingBase: 0,
      failedErrors: 0,
      captureFailures: 0,
      duration: 1500,
      endTime: "2024-01-01T12:00:00.000Z",
      testCases: [
        {
          id: "test-1",
          title: "Test 1",
          status: "passed",
          captureFilename: "test-1.png",
          totalDurationMs: 500,
          browser: "chromium",
          viewport: { width: 1920, height: 1080 },
        } as TestCaseDetail,
        {
          id: "test-2",
          title: "Test 2",
          status: "failed",
          captureFilename: "test-2.png",
          totalDurationMs: 1000,
          reason: "pixel-diff",
          diffPercentage: 5.2,
          browser: "firefox",
          viewport: { width: 1280, height: 720 },
        } as TestCaseDetail,
      ],
    } as RunOutcome,
    failures: [
      {
        id: "test-2",
        reason: "pixel-diff",
        diffPercentage: 5.2,
      },
    ],
    captureFailures: [],
    config: {
      screenshotDir: "./vividiff",
      comparison: {
        core: "odiff",
        threshold: 0.1,
        diffColor: "#00ff00",
      },
    },
    ...overrides,
  });

  describe("serializeTestData", () => {
    it("should serialize test data correctly", () => {
      const testResult = createMockTestResult();
      const serialized = serializeTestData(testResult);

      expect(serialized).toHaveProperty("success", true);
      expect(serialized).toHaveProperty("outcome");
      expect(serialized).toHaveProperty("failures");
      expect(serialized).toHaveProperty("captureFailures");
      expect(serialized).toHaveProperty("timestamp");
      expect(serialized).toHaveProperty("testCases");
      expect(serialized).toHaveProperty("browsers");
      expect(serialized).toHaveProperty("viewports");
      expect(serialized).toHaveProperty("statusCounts");
      expect(serialized).toHaveProperty("groupedByStatus");
    });

    it("should extract unique browsers", () => {
      const testResult = createMockTestResult();
      const serialized = serializeTestData(testResult);

      expect(serialized.browsers).toEqual(["chromium", "firefox"]);
    });

    it("should extract unique viewports", () => {
      const testResult = createMockTestResult();
      const serialized = serializeTestData(testResult);

      expect(serialized.viewports).toEqual(["1920x1080", "1280x720"]);
    });

    it("should calculate status counts", () => {
      const testResult = createMockTestResult();
      const serialized = serializeTestData(testResult);

      expect(serialized.statusCounts).toEqual({
        passed: 1,
        failed: 1,
      });
    });

    it("should group test cases by status", () => {
      const testResult = createMockTestResult();
      const serialized = serializeTestData(testResult);

      expect(serialized.groupedByStatus).toHaveProperty("passed");
      expect(serialized.groupedByStatus).toHaveProperty("failed");
      expect(serialized.groupedByStatus.passed).toHaveLength(1);
      expect(serialized.groupedByStatus.failed).toHaveLength(1);
      expect(serialized.groupedByStatus.passed[0].id).toBe("test-1");
      expect(serialized.groupedByStatus.failed[0].id).toBe("test-2");
    });

    it("should handle missing test cases", () => {
      const testResult = createMockTestResult({
        outcome: {
          total: 0,
          passed: 0,
          failed: 0,
          failedDiffs: 0,
          failedMissingCurrent: 0,
          failedMissingBase: 0,
          failedErrors: 0,
          captureFailures: 0,
          duration: 0,
          endTime: "2024-01-01T12:00:00.000Z",
          testCases: undefined,
        } as RunOutcome,
      });

      const serialized = serializeTestData(testResult);

      expect(serialized.testCases).toEqual([]);
      expect(serialized.browsers).toEqual([]);
      expect(serialized.viewports).toEqual([]);
      expect(serialized.statusCounts).toEqual({});
      expect(serialized.groupedByStatus).toEqual({});
    });

    it("should handle missing optional fields", () => {
      const testResult = createMockTestResult({
        failures: undefined,
        captureFailures: undefined,
      });

      const serialized = serializeTestData(testResult);

      expect(serialized.failures).toEqual([]);
      expect(serialized.captureFailures).toEqual([]);
    });

    it("should handle test cases with missing browser/viewport", () => {
      const testResult = createMockTestResult({
        outcome: {
          total: 1,
          passed: 1,
          failed: 0,
          failedDiffs: 0,
          failedMissingCurrent: 0,
          failedMissingBase: 0,
          failedErrors: 0,
          captureFailures: 0,
          duration: 500,
          endTime: "2024-01-01T12:00:00.000Z",
          testCases: [
            {
              id: "test-1",
              title: "Test 1",
              status: "passed",
              captureFilename: "test-1.png",
              totalDurationMs: 500,
              browser: undefined,
              viewport: undefined,
            } as TestCaseDetail,
          ],
        } as RunOutcome,
      });

      const serialized = serializeTestData(testResult);

      expect(serialized.browsers).toEqual(["N/A"]);
      expect(serialized.viewports).toEqual(["N/A"]);
    });

    it("should use endTime for timestamp when available", () => {
      const testResult = createMockTestResult();
      const serialized = serializeTestData(testResult);

      expect(serialized.timestamp).toBe("2024-01-01T12:00:00.000Z");
    });

    it("should use current time for timestamp when endTime is missing", () => {
      const testResult = createMockTestResult({
        outcome: {
          total: 0,
          passed: 0,
          failed: 0,
          failedDiffs: 0,
          failedMissingCurrent: 0,
          failedMissingBase: 0,
          failedErrors: 0,
          captureFailures: 0,
          duration: 0,
          endTime: undefined,
          testCases: [],
        } as RunOutcome,
      });

      const beforeTime = new Date().toISOString();
      const serialized = serializeTestData(testResult);
      const afterTime = new Date().toISOString();

      expect(new Date(serialized.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
      expect(new Date(serialized.timestamp).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
    });
  });
});
