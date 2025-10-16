import { writeFileSync, mkdirSync } from "fs";

import type { TestResult } from "@visnap/protocol";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import type { HtmlReporterOptions } from "../types";

import { serializeTestData } from "./data-serializer";
import { HtmlReporter } from "./html-reporter";
import { ImageHandler } from "./image-handler";
import { TemplateBuilder } from "./template-builder";

// Mock fs functions
vi.mock("fs", () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock the dependencies
vi.mock("./data-serializer", () => ({
  serializeTestData: vi.fn(),
}));

vi.mock("./image-handler", () => ({
  ImageHandler: vi.fn().mockImplementation(() => ({
    processTestCases: vi.fn(),
  })),
}));

vi.mock("./template-builder", () => ({
  TemplateBuilder: vi.fn().mockImplementation(() => ({
    build: vi.fn(),
  })),
}));

const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);
const mockSerializeTestData = vi.mocked(serializeTestData);
const mockImageHandler = vi.mocked(ImageHandler);
const mockTemplateBuilder = vi.mocked(TemplateBuilder);

describe("HtmlReporter", () => {
  let reporter: HtmlReporter;
  let mockTestResult: TestResult;
  let mockImageHandlerInstance: any;
  let mockTemplateBuilderInstance: any;

  beforeEach(() => {
    reporter = new HtmlReporter();
    vi.clearAllMocks();

    const testCases = [
      {
        id: "test-1",
        status: "passed" as const,
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "test-1.png",
        captureDurationMs: 1000,
        totalDurationMs: 1000,
      },
      {
        id: "test-2",
        status: "failed" as const,
        browser: "firefox",
        viewport: "1366x768",
        captureFilename: "test-2.png",
        captureDurationMs: 2000,
        totalDurationMs: 2000,
        reason: "pixel-diff",
      },
    ];

    mockTestResult = {
      success: true,
      exitCode: 0,
      outcome: {
        total: 2,
        passed: 1,
        failedDiffs: 1,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
        captureFailures: 0,
        testCases,
        durations: {
          totalDurationMs: 3000,
          totalCaptureDurationMs: 2000,
          totalComparisonDurationMs: 1000,
        },
      },
      failures: [],
      captureFailures: [],
      config: {
        screenshotDir: "/test/screenshots",
        comparison: { core: "odiff", threshold: 0.1 },
      },
    };

    // Setup mock instances
    mockImageHandlerInstance = {
      processTestCases: vi.fn().mockReturnValue([
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
      ]),
    };

    mockTemplateBuilderInstance = {
      build: vi.fn().mockReturnValue("<html>Mock HTML Report</html>"),
    };

    mockImageHandler.mockImplementation(() => mockImageHandlerInstance);
    mockTemplateBuilder.mockImplementation(() => mockTemplateBuilderInstance);

    mockSerializeTestData.mockReturnValue({
      success: true,
      outcome: mockTestResult.outcome,
      failures: [],
      captureFailures: [],
      timestamp: "2024-01-01T00:00:00.000Z",
      config: mockTestResult.config,
      duration: 3000,
      testCases: mockTestResult.outcome.testCases || [],
      browsers: ["chrome", "firefox"],
      viewports: ["1920x1080", "1366x768"],
      statusCounts: { passed: 1, failed: 1 },
      groupedByStatus: {
        passed: mockTestResult.outcome.testCases?.[0]
          ? [mockTestResult.outcome.testCases[0]]
          : [],
        failed: mockTestResult.outcome.testCases?.[1]
          ? [mockTestResult.outcome.testCases[1]]
          : [],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generate", () => {
    it("should generate HTML report with default options", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockSerializeTestData).toHaveBeenCalledWith(mockTestResult);
      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        mockTestResult.outcome.testCases || []
      );
      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          outcome: mockTestResult.outcome,
        }),
        expect.any(Array),
        undefined
      );
      expect(mockMkdirSync).toHaveBeenCalledWith("/test/screenshots", {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/test/screenshots/report.html",
        "<html>Mock HTML Report</html>"
      );
      expect(result).toBe("/test/screenshots/report.html");
    });

    it("should generate HTML report with custom output path", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/custom/path/report.html",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("/custom/path", {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        "/custom/path/report.html",
        "<html>Mock HTML Report</html>"
      );
      expect(result).toBe("/custom/path/report.html");
    });

    it("should generate HTML report with custom title", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
        title: "My Custom Report",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array),
        "My Custom Report"
      );
    });

    it("should process test cases through ImageHandler", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        mockTestResult.outcome.testCases || []
      );
    });

    it("should pass serialized data and processed test cases to TemplateBuilder", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          outcome: mockTestResult.outcome,
          failures: [],
          captureFailures: [],
          timestamp: "2024-01-01T00:00:00.000Z",
          config: mockTestResult.config,
          duration: 3000,
          testCases: mockTestResult.outcome.testCases || [],
          browsers: ["chrome", "firefox"],
          viewports: ["1920x1080", "1366x768"],
          statusCounts: { passed: 1, failed: 1 },
          groupedByStatus: expect.any(Object),
        }),
        expect.arrayContaining([
          expect.objectContaining({
            id: "test-1",
            baseImage: "./base/test-1.png",
            currentImage: "./current/test-1.png",
            diffImage: undefined,
          }),
          expect.objectContaining({
            id: "test-2",
            baseImage: "./base/test-2.png",
            currentImage: "./current/test-2.png",
            diffImage: "./diff/test-2.png",
          }),
        ]),
        undefined
      );
    });

    it("should handle empty test cases array", async () => {
      const testResultWithNoCases: TestResult = {
        ...mockTestResult,
        outcome: {
          ...mockTestResult.outcome,
          testCases: [],
        },
      };

      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(testResultWithNoCases, options);

      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        []
      );
    });

    it("should handle undefined test cases", async () => {
      const testResultWithUndefinedCases: TestResult = {
        ...mockTestResult,
        outcome: {
          ...mockTestResult.outcome,
          testCases: undefined,
        },
      };

      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(testResultWithUndefinedCases, options);

      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        []
      );
    });

    it("should create output directory if it doesn't exist", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/deep/nested/path/report.html",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockMkdirSync).toHaveBeenCalledWith("/deep/nested/path", {
        recursive: true,
      });
    });

    it("should return the correct output path", async () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/custom/report.html",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(result).toBe("/custom/report.html");
    });

    it("should handle test result with failures and capture failures", async () => {
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

      mockSerializeTestData.mockReturnValue({
        success: false,
        outcome: testResultWithFailures.outcome,
        failures: testResultWithFailures.failures || [],
        captureFailures: testResultWithFailures.captureFailures || [],
        timestamp: "2024-01-01T00:00:00.000Z",
        config: testResultWithFailures.config,
        duration: 3000,
        testCases: testResultWithFailures.outcome.testCases || [],
        browsers: ["chrome", "firefox"],
        viewports: ["1920x1080", "1366x768"],
        statusCounts: { passed: 0, failed: 2 },
        groupedByStatus: {
          failed: testResultWithFailures.outcome.testCases || [],
        },
      });

      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(testResultWithFailures, options);

      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          failures: testResultWithFailures.failures || [],
          captureFailures: testResultWithFailures.captureFailures || [],
        }),
        expect.any(Array),
        undefined
      );
    });
  });
});
