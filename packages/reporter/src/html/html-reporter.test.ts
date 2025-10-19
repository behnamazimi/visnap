import { writeFileSync, mkdirSync } from "fs";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  createMockTestResult,
  createMockTestCaseDetail,
  createMockRunOutcome,
  createMockProcessedTestCase,
  createMockSerializedReportData,
} from "../__mocks__";
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
  let mockImageHandlerInstance: any;
  let mockTemplateBuilderInstance: any;

  beforeEach(() => {
    reporter = new HtmlReporter();
    vi.clearAllMocks();

    // Setup mock instances
    mockImageHandlerInstance = {
      processTestCases: vi
        .fn()
        .mockImplementation(testCases =>
          testCases.map((tc: any) => createMockProcessedTestCase(tc))
        ),
    };

    mockTemplateBuilderInstance = {
      build: vi.fn().mockReturnValue("<html>Mock HTML Report</html>"),
    };

    mockImageHandler.mockImplementation(() => mockImageHandlerInstance);
    mockTemplateBuilder.mockImplementation(() => mockTemplateBuilderInstance);
    mockSerializeTestData.mockImplementation(result =>
      createMockSerializedReportData({
        success: result.success,
        outcome: result.outcome,
        testCases: result.outcome.testCases || [],
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generate", () => {
    it("should generate HTML report with default options", async () => {
      const testCases = [
        createMockTestCaseDetail({ id: "test-1", status: "passed" }),
        createMockTestCaseDetail({
          id: "test-2",
          status: "failed",
          reason: "pixel-diff",
        }),
      ];
      const mockTestResult = createMockTestResult({
        outcome: createMockRunOutcome(testCases),
      });
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(mockSerializeTestData).toHaveBeenCalledWith(mockTestResult);
      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        testCases
      );
      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
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
      const mockTestResult = createMockTestResult();
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
      const mockTestResult = createMockTestResult();
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
      const testCases = [createMockTestCaseDetail({ id: "test-1" })];
      const mockTestResult = createMockTestResult({
        outcome: createMockRunOutcome(testCases),
      });
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        testCases
      );
    });

    it("should pass serialized data and processed test cases to TemplateBuilder", async () => {
      const testCases = [
        createMockTestCaseDetail({ id: "test-1", status: "passed" }),
        createMockTestCaseDetail({
          id: "test-2",
          status: "failed",
          reason: "pixel-diff",
        }),
      ];
      const mockTestResult = createMockTestResult({
        outcome: createMockRunOutcome(testCases),
      });
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          testCases: expect.any(Array),
        }),
        expect.any(Array),
        undefined
      );
    });

    it("should handle empty test cases array", async () => {
      const mockTestResult = createMockTestResult({
        outcome: createMockRunOutcome([]),
      });
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        []
      );
    });

    it("should handle undefined test cases", async () => {
      const mockTestResult = createMockTestResult({
        outcome: {
          ...createMockRunOutcome([]),
          testCases: undefined,
        },
      });
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(mockTestResult, options);

      expect(mockImageHandlerInstance.processTestCases).toHaveBeenCalledWith(
        []
      );
    });

    it("should create output directory if it doesn't exist", async () => {
      const mockTestResult = createMockTestResult();
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
      const mockTestResult = createMockTestResult();
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/custom/report.html",
      };

      const result = await reporter.generate(mockTestResult, options);

      expect(result).toBe("/custom/report.html");
    });

    it("should handle test result with failures and capture failures", async () => {
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

      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      await reporter.generate(testResultWithFailures, options);

      expect(mockTemplateBuilderInstance.build).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
        expect.any(Array),
        undefined
      );
    });
  });
});
