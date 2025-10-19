import { readFileSync } from "fs";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  createMockReportData,
  createMockProcessedTestCase,
  extractDataFromHtml,
  mockFileSystem,
} from "../__mocks__";

import { TemplateBuilder } from "./template-builder";

// Mock fs functions
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
}));

const mockReadFileSync = vi.mocked(readFileSync);

describe("TemplateBuilder", () => {
  let templateBuilder: TemplateBuilder;

  beforeEach(() => {
    templateBuilder = new TemplateBuilder();
    vi.clearAllMocks();

    // Setup mock filesystem
    const fs = mockFileSystem();
    mockReadFileSync.mockImplementation(fs.readFileSync as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("build", () => {
    it("should build HTML with default title", () => {
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(mockReadFileSync).toHaveBeenCalledTimes(3);
      expect(result).toContain("<title>VISNAP Test Report</title>");
      expect(result).toContain("<h1>VISNAP Test Report</h1>");
    });

    it("should build HTML with custom title", () => {
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];
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
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain(
        `<style>body { font-family: Arial, sans-serif; }</style>`
      );
    });

    it("should inject script into the template", () => {
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain(
        `<script>function app() { return { init() { console.log('App initialized'); } }; }</script>`
      );
    });

    it("should inject enriched data into the template", () => {
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1", status: "passed" }),
        createMockProcessedTestCase({
          id: "test-2",
          status: "failed",
          reason: "pixel-diff",
        }),
      ];

      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      expect(result).toContain(`<div id="data">`);

      const injectedData = extractDataFromHtml(result);
      expect(injectedData).toEqual({
        ...mockReportData,
        outcome: {
          ...mockReportData.outcome,
          testCases: mockProcessedTestCases,
        },
      });
    });

    it("should handle empty test cases array", () => {
      const mockReportData = createMockReportData();

      const result = templateBuilder.build(mockReportData, []);

      const injectedData = extractDataFromHtml(result);
      expect(injectedData.outcome.testCases).toEqual([]);
    });

    it("should preserve all original report data properties", () => {
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

      const result = templateBuilder.build(
        mockReportData,
        mockProcessedTestCases
      );

      const injectedData = extractDataFromHtml(result);

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
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];
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
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

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
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

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
      const mockReportData = createMockReportData();
      const mockProcessedTestCases = [
        createMockProcessedTestCase({ id: "test-1" }),
      ];

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
      const mockReportData = createMockReportData();
      const complexTestCases = [
        createMockProcessedTestCase({
          id: "complex-test-1",
          status: "failed",
          captureFilename: "complex-test-1.png",
          captureDurationMs: 5000,
          totalDurationMs: 5000,
          reason: "pixel-diff",
        }),
      ];

      const result = templateBuilder.build(mockReportData, complexTestCases);

      const injectedData = extractDataFromHtml(result);

      expect(injectedData.outcome.testCases).toEqual(complexTestCases);
    });
  });
});
