import { describe, it, expect } from "vitest";

import { JsonReporter, HtmlReporter } from "./index";
import type {
  ReporterOptions,
  JsonReporterOptions,
  HtmlReporterOptions,
  ReportData,
} from "./index";

describe("Reporter Package Exports", () => {
  describe("Class Exports", () => {
    it("should export JsonReporter class", () => {
      expect(JsonReporter).toBeDefined();
      expect(typeof JsonReporter).toBe("function");

      const reporter = new JsonReporter();
      expect(reporter).toBeInstanceOf(JsonReporter);
      expect(typeof reporter.generate).toBe("function");
    });

    it("should export HtmlReporter class", () => {
      expect(HtmlReporter).toBeDefined();
      expect(typeof HtmlReporter).toBe("function");

      const reporter = new HtmlReporter();
      expect(reporter).toBeInstanceOf(HtmlReporter);
      expect(typeof reporter.generate).toBe("function");
    });
  });

  describe("Type Exports", () => {
    it("should export ReporterOptions interface", () => {
      const options: ReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/test/output.json",
      };

      expect(options.screenshotDir).toBe("/test/screenshots");
      expect(options.outputPath).toBe("/test/output.json");
    });

    it("should export JsonReporterOptions interface", () => {
      const options: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/test/output.json",
        pretty: true,
      };

      expect(options.screenshotDir).toBe("/test/screenshots");
      expect(options.outputPath).toBe("/test/output.json");
      expect(options.pretty).toBe(true);
    });

    it("should export HtmlReporterOptions interface", () => {
      const options: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/test/output.html",
        title: "My Test Report",
      };

      expect(options.screenshotDir).toBe("/test/screenshots");
      expect(options.outputPath).toBe("/test/output.html");
      expect(options.title).toBe("My Test Report");
    });

    it("should export ReportData interface", () => {
      const reportData: ReportData = {
        success: true,
        outcome: {
          testCases: [],
          total: 0,
          passed: 0,
          failedDiffs: 0,
          failedMissingCurrent: 0,
          failedMissingBase: 0,
          failedErrors: 0,
          captureFailures: 0,
        },
        failures: [],
        captureFailures: [],
        timestamp: "2024-01-01T00:00:00.000Z",
        config: {
          screenshotDir: "/test/screenshots",
          comparison: { core: "odiff", threshold: 0.1 },
        },
      };

      expect(reportData.success).toBe(true);
      expect(reportData.outcome).toBeDefined();
      expect(reportData.failures).toEqual([]);
      expect(reportData.captureFailures).toEqual([]);
      expect(reportData.timestamp).toBe("2024-01-01T00:00:00.000Z");
      expect(reportData.config).toBeDefined();
    });

    it("should allow optional properties in ReporterOptions", () => {
      const minimalOptions: ReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      expect(minimalOptions.screenshotDir).toBe("/test/screenshots");
      expect(minimalOptions.outputPath).toBeUndefined();
    });

    it("should allow optional properties in JsonReporterOptions", () => {
      const minimalOptions: JsonReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      expect(minimalOptions.screenshotDir).toBe("/test/screenshots");
      expect(minimalOptions.outputPath).toBeUndefined();
      expect(minimalOptions.pretty).toBeUndefined();
    });

    it("should allow optional properties in HtmlReporterOptions", () => {
      const minimalOptions: HtmlReporterOptions = {
        screenshotDir: "/test/screenshots",
      };

      expect(minimalOptions.screenshotDir).toBe("/test/screenshots");
      expect(minimalOptions.outputPath).toBeUndefined();
      expect(minimalOptions.title).toBeUndefined();
    });

    it("should allow optional properties in ReportData", () => {
      const minimalReportData: ReportData = {
        success: true,
        outcome: {
          testCases: [],
          total: 0,
          passed: 0,
          failedDiffs: 0,
          failedMissingCurrent: 0,
          failedMissingBase: 0,
          failedErrors: 0,
          captureFailures: 0,
        },
        failures: [],
        captureFailures: [],
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      expect(minimalReportData.success).toBe(true);
      expect(minimalReportData.outcome).toBeDefined();
      expect(minimalReportData.failures).toEqual([]);
      expect(minimalReportData.captureFailures).toEqual([]);
      expect(minimalReportData.timestamp).toBe("2024-01-01T00:00:00.000Z");
      expect(minimalReportData.config).toBeUndefined();
    });
  });

  describe("Integration", () => {
    it("should work with both reporter types using the same base options", () => {
      const baseOptions: ReporterOptions = {
        screenshotDir: "/test/screenshots",
        outputPath: "/test/report",
      };

      const jsonOptions: JsonReporterOptions = {
        ...baseOptions,
        outputPath: "/test/report.json",
        pretty: true,
      };

      const htmlOptions: HtmlReporterOptions = {
        ...baseOptions,
        outputPath: "/test/report.html",
        title: "Test Report",
      };

      expect(jsonOptions.screenshotDir).toBe("/test/screenshots");
      expect(jsonOptions.outputPath).toBe("/test/report.json");
      expect(jsonOptions.pretty).toBe(true);

      expect(htmlOptions.screenshotDir).toBe("/test/screenshots");
      expect(htmlOptions.outputPath).toBe("/test/report.html");
      expect(htmlOptions.title).toBe("Test Report");
    });
  });
});
