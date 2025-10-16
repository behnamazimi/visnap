import { writeFileSync, mkdirSync } from "fs";

import type { TestResult, RunOutcome, TestCaseDetail } from "@visnap/protocol";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { JsonReporter } from "./json-reporter";

// Mock fs functions
vi.mock("fs", () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

describe("JsonReporter", () => {
  let reporter: JsonReporter;
  let mockTestResult: TestResult;

  beforeEach(() => {
    reporter = new JsonReporter();
    vi.clearAllMocks();

    // Create mock test result
    const mockOutcome: RunOutcome = {
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
        } as TestCaseDetail,
        {
          id: "test-2",
          title: "Test 2",
          status: "failed",
          captureFilename: "test-2.png",
          totalDurationMs: 1000,
          reason: "pixel-diff",
          diffPercentage: 5.2,
        } as TestCaseDetail,
      ],
    };

    mockTestResult = {
      success: false,
      outcome: mockOutcome,
      failures: [
        {
          id: "test-2",
          reason: "pixel-diff",
          diffPercentage: 5.2,
        },
      ],
      captureFailures: [],
      config: {
        screenshotDir: "./visnap",
        comparison: {
          core: "odiff",
          threshold: 0.1,
          diffColor: "#00ff00",
        },
      },
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("generate", () => {
    it("should generate JSON report with file output", async () => {
      const options = {
        outputPath: "/path/to/report.json",
        screenshotDir: "./visnap",
        pretty: true,
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("/path/to", {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/path/to/report.json",
        expect.stringContaining('"success": false')
      );
      expect(result).toBe("/path/to/report.json");
    });

    it("should generate JSON report with default output path", async () => {
      const options = {
        screenshotDir: "./visnap",
        pretty: true,
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("./visnap", {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "./visnap/report.json",
        expect.stringContaining('"success": false')
      );
      expect(result).toBe("./visnap/report.json");
    });

    it("should generate compact JSON when pretty is false", async () => {
      const options = {
        outputPath: "/path/to/report.json",
        screenshotDir: "./visnap",
        pretty: false,
      };

      await reporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain("\n");
      expect(writtenContent).not.toContain("  ");
    });

    it("should include all required fields in the report", async () => {
      const options = {
        outputPath: "/path/to/report.json",
        screenshotDir: "./visnap",
        pretty: true,
      };

      await reporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const report = JSON.parse(writtenContent);

      expect(report).toHaveProperty("success", false);
      expect(report).toHaveProperty("outcome");
      expect(report).toHaveProperty("failures");
      expect(report).toHaveProperty("captureFailures");
      expect(report).toHaveProperty("timestamp");
      expect(report.outcome).toHaveProperty("duration", 1500);
      expect(report.outcome).toHaveProperty("testCases");
    });

    it("should handle missing optional fields", async () => {
      const minimalTestResult: TestResult = {
        success: true,
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
          testCases: [],
        },
        failures: undefined,
        captureFailures: undefined,
      };

      const options = {
        outputPath: "/path/to/report.json",
        screenshotDir: "./visnap",
        pretty: true,
      };

      await reporter.generate(minimalTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const report = JSON.parse(writtenContent);

      expect(report.failures).toEqual([]);
      expect(report.captureFailures).toEqual([]);
      expect(report.success).toBe(true);
    });

    it("should generate valid JSON timestamp", async () => {
      const options = {
        outputPath: "/path/to/report.json",
        screenshotDir: "./visnap",
        pretty: true,
      };

      const beforeTime = new Date().toISOString();
      await reporter.generate(mockTestResult, options);
      const afterTime = new Date().toISOString();

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const report = JSON.parse(writtenContent);

      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeTime).getTime()
      );
      expect(new Date(report.timestamp).getTime()).toBeLessThanOrEqual(
        new Date(afterTime).getTime()
      );
    });
  });
});
