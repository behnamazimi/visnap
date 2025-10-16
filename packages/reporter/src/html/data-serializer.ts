import type { TestResult } from "@visnap/protocol";

import type { SerializedReportData } from "../types";

export function serializeTestData(result: TestResult): SerializedReportData {
  const testCases = result.outcome.testCases || [];

  const browsers = Array.from(
    new Set(testCases.map(tc => tc.browser || "N/A"))
  );
  const viewports = Array.from(
    new Set(
      testCases.map(tc => {
        if (!tc.viewport) return "N/A";
        if (typeof tc.viewport === "string") return tc.viewport;
        return `${tc.viewport.width}x${tc.viewport.height}`;
      })
    )
  );

  const statusCounts = testCases.reduce(
    (acc, tc) => {
      acc[tc.status] = (acc[tc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const groupedByStatus = testCases.reduce(
    (acc, tc) => {
      if (!acc[tc.status]) {
        acc[tc.status] = [];
      }
      acc[tc.status].push(tc);
      return acc;
    },
    {} as Record<string, typeof testCases>
  );

  return {
    success: result.success,
    outcome: result.outcome,
    failures: result.failures || [],
    captureFailures: result.captureFailures || [],
    timestamp: new Date().toISOString(),
    config: result.config,
    duration: result.outcome.durations?.totalDurationMs,
    testCases,
    browsers,
    viewports,
    statusCounts,
    groupedByStatus,
  };
}
