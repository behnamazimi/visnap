import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { TestResult } from "@visnap/protocol";
import type { JsonReporterOptions, ReportData } from "../types";

export class JsonReporter {
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

    const outputPath = options.outputPath || `${options.screenshotDir}/report.json`;
    const outputDir = dirname(outputPath);
    
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, reportJson);
    
    return outputPath;
  }
}
