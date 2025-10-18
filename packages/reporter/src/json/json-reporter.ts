/**
 * @fileoverview JSON reporter implementation for Visnap visual testing framework
 *
 * Generates JSON reports from test results with comprehensive test case details
 * and outcome statistics.
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";

import type { TestResult } from "@visnap/protocol";

import type { JsonReporterOptions, ReportData } from "../types";

/**
 * JSON reporter for generating test result reports in JSON format
 *
 * @example
 * ```typescript
 * const reporter = new JsonReporter();
 * const reportPath = await reporter.generate(testResult, {
 *   outputPath: "./reports/test-results.json",
 *   screenshotDir: "./screenshots"
 * });
 * ```
 */
export class JsonReporter {
  /**
   * Generates a JSON report from test results
   * @param result - Test result data to include in the report
   * @param options - Reporter options including output path and screenshot directory
   * @returns Promise resolving to the absolute path of the generated report
   * @throws {Error} If file writing fails
   */
  async generate(
    result: TestResult,
    options: JsonReporterOptions
  ): Promise<string> {
    const report: ReportData = {
      success: result.success,
      outcome: result.outcome,
      failures: result.failures || [],
      captureFailures: result.captureFailures || [],
      config: result.config,
      timestamp: new Date().toISOString(),
    };

    const reportJson = JSON.stringify(
      report,
      null,
      options.pretty !== false ? 2 : undefined
    );

    const outputPath =
      options.outputPath || `${options.screenshotDir}/report.json`;
    const outputDir = dirname(outputPath);

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, reportJson);

    return outputPath;
  }
}
