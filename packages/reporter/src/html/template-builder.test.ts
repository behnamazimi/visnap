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
    };

    mockProcessedTestCases = [
      {
        id: "test-1",
        status: "passed",
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "test-1.png",
        captureDurationMs: 1000,
        totalDurationMs: 1000,
        baseImage: "./base/test-1.png",
        currentImage: "./current/test-1.png",
        diffImage: undefined,
      },
      {
        id: "test-2",
        status: "failed",
        browser: "firefox",
        viewport: "1366x768",
        captureFilename: "test-2.png",
        captureDurationMs: 2000,
        totalDurationMs: 2000,
        reason: "pixel-diff",
        baseImage: "./base/test-2.png",
        currentImage: "./current/test-2.png",
        diffImage: "./diff/test-2.png",
      },
    ];

    // Mock file contents
    mockReadFileSync.mockImplementation((path: any) => {
      if (path.includes("template.html")) {
        return `<!DOCTYPE html>
<html>
<head>
  <title>{{TITLE}}</title>
  <style>{{STYLES}}</style>
</head>
<body>
  <div id="app" x-data="app()">
    <h1>{{TITLE}}</h1>
    <div id="data">{{DATA}}</div>
  </div>
  <script>{{SCRIPT}}</script>
</body>
</html>`;
      }
      if (path.includes("styles.css")) {
        return `body { font-family: Arial, sans-serif; }`;
      }
      if (path.includes("alpine-app.js")) {
        return `function app() { return { init() { console.log('App initialized'); } }; }`;
      }
      throw new Error("File not found");
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("build", () => {
    it("should build HTML with default title", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
      expect(result).toContain("<title>VISNAP Test Report</title>");
      expect(result).toContain("<h1>VISNAP Test Report</h1>");
    });

    it("should build HTML with custom title", () => {
      const customTitle = "My Custom Test Report";
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases,
        customTitle
      );

      expect(result).toContain(`<title>${customTitle}</title>`);
      expect(result).toContain(`<h1>${customTitle}</h1>`);
    });

    it("should inject styles into the template", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain(
        `<style>body { font-family: Arial, sans-serif; }</style>`
      );
    });

    it("should inject script into the template", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain(
        `<script>function app() { return { init() { console.log('App initialized'); } }; }</script>`
      );
    });

    it("should inject enriched data into the template", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain(`<div id="data">`);

      // Extract the JSON data from the HTML
      const dataMatch = result.match(/<div id="data">(.*?)<\/div>/s);
      expect(dataMatch).toBeTruthy();

      const injectedData = JSON.parse(dataMatch![1]);
      expect(injectedData).toEqual({
        ...mockReportData,
        outcome: {
          ...mockReportData.outcome,
          testCases: mockProcessedTestCases,
        },
      });
    });

    it("should handle empty test cases array", () => {
      const result = templateBuilder.build(mockReportData, []);

      const dataMatch = result.match(/<div id="data">(.*?)<\/div>/s);
      const injectedData = JSON.parse(dataMatch![1]);

      expect(injectedData.outcome.testCases).toEqual([]);
    });

    it("should preserve all original report data properties", () => {
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      const dataMatch = result.match(/<div id="data">(.*?)<\/div>/s);
      const injectedData = JSON.parse(dataMatch![1]);

      expect(injectedData.success).toBe(mockReportData.success);
      expect(injectedData.outcome).toEqual({
        ...mockReportData.outcome,
        testCases: mockProcessedTestCases,
      });
      expect(injectedData.failures).toEqual(mockReportData.failures);
      expect(injectedData.captureFailures).toEqual(
        mockReportData.captureFailures
      );
      expect(injectedData.timestamp).toBe(mockReportData.timestamp);
      expect(injectedData.config).toEqual(mockReportData.config);
    });

    it("should replace all title placeholders", () => {
      const customTitle = "Test Report";
      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases,
        customTitle
      );

      // Count occurrences of the title in the result
      const titleMatches = result.match(new RegExp(customTitle, "g"));
      expect(titleMatches).toHaveLength(2); // Once in <title> and once in <h1>
    });

    it("should handle missing template file", () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes("template.html")) {
          throw new Error("File not found");
        }
        return "mock content";
      });

      expect(() => {
        templateBuilder.build(mockReportData, mockProcessedTestCases);
      }).toThrow("File not found");
    });

    it("should handle missing styles file", () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes("styles.css")) {
          throw new Error("File not found");
        }
        return "mock content";
      });

      expect(() => {
        templateBuilder.build(mockReportData, mockProcessedTestCases);
      }).toThrow("File not found");
    });

    it("should handle missing script file", () => {
      mockReadFileSync.mockImplementation((path: any) => {
        if (path.includes("alpine-app.js")) {
          throw new Error("File not found");
        }
        return "mock content";
      });

      expect(() => {
        templateBuilder.build(mockReportData, mockProcessedTestCases);
      }).toThrow("File not found");
    });

    it("should handle complex test case data", () => {
      const complexTestCases: ProcessedTestCase[] = [
        {
          id: "complex-test-1",
          status: "failed",
          browser: "chrome",
          viewport: "1920x1080",
          captureFilename: "complex-test-1.png",
          captureDurationMs: 5000,
          totalDurationMs: 5000,
          reason: "pixel-diff",
          baseImage: "./base/complex-test-1.png",
          currentImage: "./current/complex-test-1.png",
          diffImage: "./diff/complex-test-1.png",
        },
      ];

      const result = templateBuilder.build(mockReportData, complexTestCases);

      const dataMatch = result.match(/<div id="data">(.*?)<\/div>/s);
      const injectedData = JSON.parse(dataMatch![1]);

      expect(injectedData.outcome.testCases).toEqual(complexTestCases);
    });
  });
});
