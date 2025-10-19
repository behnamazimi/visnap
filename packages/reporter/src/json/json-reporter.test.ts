import { writeFileSync, mkdirSync } from "fs";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  createMockTestResult,
  captureWrittenJson,
  isRecentTimestamp,
} from "../__mocks__";
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

  beforeEach(() => {
    reporter = new JsonReporter();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generate", () => {
    it("should generate a JSON report with default options", async () => {
      const mockTestResult = createMockTestResult();
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
      const mockTestResult = createMockTestResult();
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
      const mockTestResult = createMockTestResult();
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      const parsed = captureWrittenJson(mockWriteFileSync);
      expect(parsed).toEqual({
        success: true,
        outcome: mockTestResult.outcome,
        failures: [],
        captureFailures: [],
        config: mockTestResult.config,
        timestamp: expect.any(String),
      });
      expect(isRecentTimestamp(parsed.timestamp)).toBe(true);
    });

    it("should format JSON without pretty printing when pretty is false", async () => {
      const mockTestResult = createMockTestResult();
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
      const testResultWithFailures = createMockTestResult({
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
      });

      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(testResultWithFailures, options);

      const parsed = captureWrittenJson(mockWriteFileSync);
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
      const mockTestResult = createMockTestResult();
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      const parsed = captureWrittenJson(mockWriteFileSync);
      expect(isRecentTimestamp(parsed.timestamp)).toBe(true);
    });
  });
});
