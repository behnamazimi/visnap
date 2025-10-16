import { writeFileSync, mkdirSync } from "fs";

import type { TestResult } from "@visnap/protocol";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { JsonReporterOptions } from "../types";

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

    mockTestResult = {
      success: true,
      exitCode: 0,
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
      config: {
        screenshotDir: "/test/screenshots",
        comparison: { core: "odiff", threshold: 0.1 },
      },
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generate", () => {
    it("should generate a JSON report with default options", async () => {
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("/test/screenshots", {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/test/screenshots/report.json",
        expect.stringContaining('"success": true')
      );
      expect(result).toBe("/test/screenshots/report.json");
    });

    it("should generate a JSON report with custom output path", async () => {
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/custom/path/report.json",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("/custom/path", {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/custom/path/report.json",
        expect.any(String)
      );
      expect(result).toBe("/custom/path/report.json");
    });

    it("should format JSON with pretty printing by default", async () => {
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenContent);
      expect(parsed).toEqual({
        success: true,
        outcome: mockTestResult.outcome,
        failures: [],
        captureFailures: [],
        config: mockTestResult.config,
        timestamp: expect.any(String),
      });
    });

    it("should format JSON without pretty printing when pretty is false", async () => {
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
        pretty: false,
      };

      await reporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      // Should be minified (no spaces/indentation)
      expect(writtenContent).not.toContain("  ");
      expect(writtenContent).not.toContain("\n");
    });

    it("should handle test result with failures", async () => {
      const testResultWithFailures: TestResult = {
        ...mockTestResult,
        success: false,
        failures: [
          {
            id: "test-1",
            reason: "pixel-diff",
            diffPercentage: 5.2,
          },
        ],
        captureFailures: [
          {
            id: "test-2",
            error: "Screenshot failed",
          },
        ],
      };

      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(testResultWithFailures, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenContent);
      expect(parsed.success).toBe(false);
      expect(parsed.failures).toEqual([
        {
          id: "test-1",
          reason: "pixel-diff",
          diffPercentage: 5.2,
        },
      ]);
      expect(parsed.captureFailures).toEqual([
        {
          id: "test-2",
          error: "Screenshot failed",
        },
      ]);
    });

    it("should include timestamp in the report", async () => {
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      const beforeTime = new Date().toISOString();
      await reporter.generate(mockTestResult, options);
      const afterTime = new Date().toISOString();

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const parsed = JSON.parse(writtenContent);
      const reportTime = new Date(parsed.timestamp).getTime();
      const beforeTimeMs = new Date(beforeTime).getTime();
      const afterTimeMs = new Date(afterTime).getTime();

      expect(reportTime).toBeGreaterThanOrEqual(beforeTimeMs);
      expect(reportTime).toBeLessThanOrEqual(afterTimeMs);
    });
  });
});
