import log from "./logger";

import { type CompareResult } from "@/lib";
import { getPackageInfo } from "@/lib";

export interface VTTBrowserReport {
  name: string;
  results: CompareResult[];
}

export interface VTTReportSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface VTTReport {
  browsers: VTTBrowserReport[];
  date: string;
  version: string;
  summary: VTTReportSummary;
}

export const createEmptyReport = async (): Promise<VTTReport> => ({
  browsers: [],
  date: new Date().toISOString(),
  version: (await getPackageInfo()).version,
  summary: { total: 0, passed: 0, failed: 0 },
});

export const appendBrowserResults = (
  report: VTTReport,
  browserName: string,
  results: CompareResult[]
): void => {
  const passed = results.filter(r => r.match).length;
  const failed = results.length - passed;
  report.browsers.push({ name: browserName, results });
  report.summary.total += results.length;
  report.summary.passed += passed;
  report.summary.failed += failed;
};

export const writeJsonReport = async (
  path: string,
  report: VTTReport
): Promise<void> => {
  try {
    const fs = await import("fs");
    fs.writeFileSync(path, JSON.stringify(report, null, 2), "utf-8");
    log.success(`Wrote JSON report to ${path}`);
  } catch (e) {
    log.error(
      `Failed to write JSON report: ${e instanceof Error ? e.message : String(e)}`
    );
  }
};
