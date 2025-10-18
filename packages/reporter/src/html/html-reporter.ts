/**
 * @fileoverview HTML reporter implementation for Visnap visual testing framework
 *
 * Generates interactive HTML reports from test results with visual diff comparison,
 * test case filtering, and comprehensive statistics.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

import type { TestResult } from "@visnap/protocol";

import type { HtmlReporterOptions } from "../types";

import { serializeTestData } from "./data-serializer";
import { ImageHandler } from "./image-handler";
import { TemplateBuilder } from "./template-builder";

/**
 * HTML reporter for generating interactive test result reports
 *
 * @example
 * ```typescript
 * const reporter = new HtmlReporter();
 * const reportPath = await reporter.generate(testResult, {
 *   outputPath: "./reports/test-results.html",
 *   screenshotDir: "./screenshots"
 * });
 * ```
 */
export class HtmlReporter {
  /**
   * Generates an HTML report from test results
   * @param result - Test result data to include in the report
   * @param options - Reporter options including output path and screenshot directory
   * @returns Promise resolving to the absolute path of the generated report
   * @throws {Error} If file writing fails
   */
  async generate(
    result: TestResult,
    options: HtmlReporterOptions
  ): Promise<string> {
    const data = serializeTestData(result);
    const testCases = result.outcome.testCases || [];

    // Process images
    const imageHandler = new ImageHandler();
    const processedTests = imageHandler.processTestCases(testCases);

    // Build HTML
    const templateBuilder = new TemplateBuilder();
    const html = templateBuilder.build(data, processedTests, options.title);

    // Determine output path
    const outputPath =
      options.outputPath || join(options.screenshotDir, "report.html");
    const outputDir = dirname(outputPath);

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, html);

    return outputPath;
  }
}
