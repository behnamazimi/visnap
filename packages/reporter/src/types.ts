import type { TestCaseDetail, RunOutcome } from "@vividiff/protocol";

export interface ReporterOptions {
  outputPath?: string;
  screenshotDir: string;
}

export interface JsonReporterOptions extends ReporterOptions {
  pretty?: boolean;
}

export interface HtmlReporterOptions extends ReporterOptions {
  title?: string;
}

export interface ReportData {
  success: boolean;
  outcome: RunOutcome;
  failures: Array<{
    id: string;
    reason: string;
    diffPercentage?: number;
  }>;
  captureFailures: Array<{
    id: string;
    error: string;
  }>;
  timestamp: string;
  config?: {
    screenshotDir?: string;
    comparison?: {
      core?: string;
      threshold?: number;
      diffColor?: string;
    };
    adapters?: Record<string, unknown>;
    runtime?: Record<string, unknown>;
    viewport?: Record<string, unknown>;
  };
}

export interface ProcessedTestCase extends TestCaseDetail {
  baseImage?: string;      // Relative path to base image
  currentImage?: string;   // Relative path to current image
  diffImage?: string;      // Relative path to diff image
}

export interface SerializedReportData extends ReportData {
  duration?: number;
  testCases: ProcessedTestCase[];
  browsers: string[];
  viewports: string[];
  statusCounts: Record<string, number>;
  groupedByStatus: Record<string, ProcessedTestCase[]>;
}
