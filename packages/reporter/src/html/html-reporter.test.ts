import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { HtmlReporter } from "./html-reporter";
import type { TestResult } from "@vividiff/core";
import type { RunOutcome, TestCaseDetail } from "@vividiff/protocol";

// Mock fs functions
vi.mock("fs", () => ({
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

describe("HtmlReporter", () => {
  let htmlReporter: HtmlReporter;
  let mockTestResult: TestResult;

  beforeEach(() => {
    htmlReporter = new HtmlReporter();
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
        screenshotDir: "./vividiff",
        comparison: {
          core: "odiff",
          threshold: 0.1,
          diffColor: "#00ff00",
        },
      },
    };

    // Mock file reads for template builder
    mockReadFileSync
      .mockReturnValueOnce(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <style>{{STYLES}}</style>
</head>
<body x-data="vividiffReport()" x-init="init()">
  <h1>{{TITLE}}</h1>
  <script>
    window.__VIVIDIFF_DATA__ = {{DATA}};
    {{SCRIPT}}
  </script>
</body>
</html>`)
      .mockReturnValueOnce("body { font-family: Arial; }")
      .mockReturnValueOnce("function vividiffReport() { return {}; }");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("generate", () => {
    it("should generate HTML report with default output path", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      const result = await htmlReporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("vividiff", { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "vividiff/report.html",
        expect.stringContaining("<!DOCTYPE html>")
      );
      expect(result).toBe("vividiff/report.html");
    });

    it("should generate HTML report with custom output path", async () => {
      const options = {
        outputPath: "/custom/path/report.html",
        screenshotDir: "./vividiff",
        title: "Custom Report",
      };

      const result = await htmlReporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("/custom/path", { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/custom/path/report.html",
        expect.stringContaining("<!DOCTYPE html>")
      );
      expect(result).toBe("/custom/path/report.html");
    });

    it("should use screenshot directory from test result config when not provided", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      const result = await htmlReporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("vividiff", { recursive: true });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "vividiff/report.html",
        expect.any(String)
      );
      expect(result).toBe("vividiff/report.html");
    });

    it("should use default screenshot directory when not provided in config", async () => {
      const testResultWithoutConfig = {
        ...mockTestResult,
        config: undefined,
      };

      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      const result = await htmlReporter.generate(testResultWithoutConfig, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("vividiff", { recursive: true });
      expect(result).toBe("vividiff/report.html");
    });

    it("should include all required template files", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      await htmlReporter.generate(mockTestResult, options);

      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
      // Verify that template, styles, and script files are read
      const calls = mockReadFileSync.mock.calls;
      expect(calls.some(call => call[0].includes("template.html"))).toBe(true);
      expect(calls.some(call => call[0].includes("styles.css"))).toBe(true);
      expect(calls.some(call => call[0].includes("alpine-app.js"))).toBe(true);
    });

    it("should generate valid HTML structure", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      await htmlReporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain("<!DOCTYPE html>");
      expect(writtenContent).toContain("<html lang=\"en\">");
      expect(writtenContent).toContain("<head>");
      expect(writtenContent).toContain("<body x-data=\"vividiffReport()\" x-init=\"init()\">");
    });

    it("should include test data in the HTML", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      await htmlReporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain("window.__VIVIDIFF_DATA__");
      expect(writtenContent).toContain('"success":false');
      expect(writtenContent).toContain('"testCases"');
    });

    it("should handle empty test cases", async () => {
      const testResultWithNoTests = {
        ...mockTestResult,
        outcome: {
          ...mockTestResult.outcome,
          testCases: [],
        },
      };

      const options = {
        screenshotDir: "./vividiff",
        title: "Empty Report",
      };

      const result = await htmlReporter.generate(testResultWithNoTests, options);

      expect(result).toBe("vividiff/report.html");
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "vividiff/report.html",
        expect.stringContaining("window.__VIVIDIFF_DATA__")
      );
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
        config: undefined,
      };

      const options = {
        screenshotDir: "./vividiff",
        title: "Minimal Report",
      };

      const result = await htmlReporter.generate(minimalTestResult, options);

      expect(result).toBe("vividiff/report.html");
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "vividiff/report.html",
        expect.stringContaining("window.__VIVIDIFF_DATA__")
      );
    });

    it("should use custom title when provided", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Custom Test Report",
      };

      await htmlReporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      expect(writtenContent).toContain("<title>Custom Test Report</title>");
    });

    it("should handle file system errors gracefully", async () => {
      mockMkdirSync.mockImplementation(() => {
        throw new Error("Permission denied");
      });

      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      await expect(htmlReporter.generate(mockTestResult, options)).rejects.toThrow("Permission denied");
    });

    it("should process test cases and add image paths", async () => {
      const options = {
        screenshotDir: "./vividiff",
        title: "Test Report",
      };

      await htmlReporter.generate(mockTestResult, options);

      const writtenContent = mockWriteFileSync.mock.calls[0][1] as string;
      const dataMatch = writtenContent.match(/window\.__VIVIDIFF_DATA__ = (.+);/);
      const data = JSON.parse(dataMatch![1]);
      
      expect(data.outcome.testCases).toHaveLength(2);
      expect(data.outcome.testCases[0]).toHaveProperty("baseImage");
      expect(data.outcome.testCases[0]).toHaveProperty("currentImage");
      expect(data.outcome.testCases[1]).toHaveProperty("baseImage");
      expect(data.outcome.testCases[1]).toHaveProperty("currentImage");
    });
  });
});
