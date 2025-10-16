import { readFileSync } from "fs";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { ReportData, ProcessedTestCase } from "../types";

import { TemplateBuilder } from "./template-builder";

// Mock fs functions
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
}));

const mockReadFileSync = vi.mocked(readFileSync);

describe("TemplateBuilder", () => {
  let templateBuilder: TemplateBuilder;
  let mockReportData: ReportData;
  let mockProcessedTestCases: ProcessedTestCase[];

  beforeEach(() => {
    templateBuilder = new TemplateBuilder();
    vi.clearAllMocks();

    mockReportData = {
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
        testCases: [],
      },
      failures: [
        {
          id: "test-2",
          reason: "pixel-diff",
          diffPercentage: 5.2,
        },
      ],
      captureFailures: [],
      timestamp: "2024-01-01T12:00:00.000Z",
      duration: 1500,
    };

    mockProcessedTestCases = [
      {
        id: "test-1",
        title: "Test 1",
        status: "passed",
        captureFilename: "test-1.png",
        totalDurationMs: 500,
        browser: "chromium",
        viewport: { width: 1920, height: 1080 },
        baseImage: "base/test-1.png",
        currentImage: "current/test-1.png",
      } as ProcessedTestCase,
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
        baseImage: "base/test-2.png",
        currentImage: "current/test-2.png",
        diffImage: "diff/test-2.png",
      } as ProcessedTestCase,
    ];

    // Mock file reads
    mockReadFileSync
      .mockReturnValueOnce(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>{{STYLES}}</style>
</head>
<body x-data="visnapReport()" x-init="init()">
  <h1>{{TITLE}}</h1>
  <script>
    window.__VISNAP_DATA__ = {{DATA}};
    {{SCRIPT}}
  </script>
</body>
</html>`
      )
      .mockReturnValueOnce("body { font-family: Arial; }")
      .mockReturnValueOnce("function visnapReport() { return {}; }");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("build", () => {
    it("should build HTML template with all placeholders replaced", () => {
      const title = "Test Report";
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases,
        title
      );

      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<title>Test Report</title>");
      expect(result).toContain("body { font-family: Arial; }");
      expect(result).toContain("function visnapReport() { return {}; }");
    });

    it("should replace {{TITLE}} placeholder", () => {
      const title = "Custom Report Title";
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases,
        title
      );

      expect(result).toContain(`<title>${title}</title>`);
    });

    it("should replace {{DATA}} placeholder with JSON data", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      const dataMatch = result.match(/window\.__VISNAP_DATA__ = (.+);/);
      expect(dataMatch).toBeTruthy();

      const data = JSON.parse(dataMatch![1]);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("outcome");
      expect(data.outcome).toHaveProperty("testCases");
      expect(data.outcome.testCases).toHaveLength(2);
    });

    it("should include processed test cases in the data", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      const dataMatch = result.match(/window\.__VISNAP_DATA__ = (.+);/);
      const data = JSON.parse(dataMatch![1]);

      expect(data.outcome.testCases).toEqual(mockProcessedTestCases);
    });

    it("should use default title when not provided", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain("<title>VISNAP Test Report</title>");
    });

    it("should handle empty test cases array", () => {
      const result = templateBuilder.build(mockReportData, []);

      const dataMatch = result.match(/window\.__VISNAP_DATA__ = (.+);/);
      const data = JSON.parse(dataMatch![1]);

      expect(data.outcome.testCases).toEqual([]);
    });

    it("should handle missing optional fields in report data", () => {
      const minimalReportData: ReportData = {
        success: false,
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
        failures: [],
        captureFailures: [],
        timestamp: "2024-01-01T12:00:00.000Z",
      };

      const result = templateBuilder.build(minimalReportData, []);

      const dataMatch = result.match(/window\.__VISNAP_DATA__ = (.+);/);
      const data = JSON.parse(dataMatch![1]);

      expect(data.success).toBe(false);
      expect(data.failures).toEqual([]);
      expect(data.captureFailures).toEqual([]);
    });

    it("should replace multiple {{TITLE}} occurrences", () => {
      mockReadFileSync
        .mockReturnValueOnce(
          "<!DOCTYPE html><html><head><title>{{TITLE}}</title></head><body><h1>{{TITLE}}</h1></body></html>"
        )
        .mockReturnValueOnce("body { font-family: Arial; }")
        .mockReturnValueOnce("function visnapReport() { return {}; }");

      const title = "Test Report";
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases,
        title
      );

      expect(result).toContain(`<title>${title}</title>`);
      expect(result).toContain(`<h1>${title}</h1>`);
    });

    it("should preserve JSON data structure", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      const dataMatch = result.match(/window\.__VISNAP_DATA__ = (.+);/);
      const data = JSON.parse(dataMatch![1]);

      // Verify the structure is preserved
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("outcome");
      expect(data).toHaveProperty("failures");
      expect(data).toHaveProperty("captureFailures");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("duration");

      // Verify outcome structure
      expect(data.outcome).toHaveProperty("total");
      expect(data.outcome).toHaveProperty("passed");
      expect(data.outcome).toHaveProperty("failed");
      expect(data.outcome).toHaveProperty("testCases");
    });
  });
});
