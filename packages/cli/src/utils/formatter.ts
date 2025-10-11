import { log } from "@vividiff/core";
import chalk from "chalk";
import { table } from "table";

export interface TestResult {
  id: string;
  status: "passed" | "failed" | "error";
  reason?: string;
  diffPercentage?: number;
  error?: string;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  captureFailures: number;
}

/**
 * Format test results into a beautiful table
 */
export function formatTestResults(results: TestResult[]): void {
  const data = [
    [chalk.cyan("Status"), chalk.cyan("Test ID"), chalk.cyan("Details")],
    ...results.map(result => [
      formatStatus(result.status),
      result.id,
      formatDetails(result),
    ]),
  ];

  const config = {
    columns: [{ width: 10 }, { width: 40 }, { width: 50 }],
    border: {
      topBody: "─",
      topJoin: "┬",
      topLeft: "┌",
      topRight: "┐",
      bottomBody: "─",
      bottomJoin: "┴",
      bottomLeft: "└",
      bottomRight: "┘",
      bodyLeft: "│",
      bodyRight: "│",
      bodyJoin: "│",
      joinBody: "─",
      joinLeft: "├",
      joinRight: "┤",
      joinJoin: "┼",
    },
  };

  log.plain(table(data, config));
}

/**
 * Format test summary statistics
 */
export function formatTestSummary(summary: TestSummary): void {
  const total = summary.total;
  const passedPct =
    total > 0 ? ((summary.passed / total) * 100).toFixed(1) : "0.0";
  const failedPct =
    total > 0 ? ((summary.failed / total) * 100).toFixed(1) : "0.0";
  const errorPct =
    total > 0 ? ((summary.errors / total) * 100).toFixed(1) : "0.0";

  const data = [
    [chalk.cyan("Metric"), chalk.cyan("Count"), chalk.cyan("Percentage")],
    ["Total Tests", total.toString(), "100.0%"],
    ["Passed", summary.passed.toString(), `${passedPct}%`],
    ["Failed", summary.failed.toString(), `${failedPct}%`],
    ["Errors", summary.errors.toString(), `${errorPct}%`],
    ["Capture Failures", summary.captureFailures.toString(), "-"],
  ];

  const config = {
    columns: [{ width: 20 }, { width: 10 }, { width: 12 }],
    border: {
      topBody: "─",
      topJoin: "┬",
      topLeft: "┌",
      topRight: "┐",
      bottomBody: "─",
      bottomJoin: "┴",
      bottomLeft: "└",
      bottomRight: "┘",
      bodyLeft: "│",
      bodyRight: "│",
      bodyJoin: "│",
      joinBody: "─",
      joinLeft: "├",
      joinRight: "┤",
      joinJoin: "┼",
    },
  };

  log.plain("\n📊 Test Summary:");
  log.plain(table(data, config));
}

/**
 * Format individual test status
 */
function formatStatus(status: TestResult["status"]): string {
  switch (status) {
    case "passed":
      return chalk.green("✅ PASS");
    case "failed":
      return chalk.red("❌ FAIL");
    case "error":
      return chalk.red("💥 ERROR");
    default:
      return chalk.gray("❓ UNKNOWN");
  }
}

/**
 * Format test details
 */
function formatDetails(result: TestResult): string {
  if (result.status === "passed") {
    return chalk.gray("No issues detected");
  }

  if (result.error) {
    return chalk.red(result.error);
  }

  if (result.reason) {
    let details = result.reason;
    if (result.diffPercentage !== undefined) {
      details += ` (${result.diffPercentage.toFixed(2)}% difference)`;
    }
    return chalk.yellow(details);
  }

  return chalk.gray("Unknown issue");
}

/**
 * Format next steps suggestions
 */
export function formatNextSteps(summary: TestSummary): void {
  log.plain("\n💡 Next Steps:");

  if (summary.failed > 0) {
    log.plain(
      "• Review failed tests and update baselines if changes are intentional:"
    );
    log.plain("  " + chalk.cyan("vividiff update"));
  }

  if (summary.errors > 0) {
    log.plain("• Check error details and fix configuration issues");
  }

  if (summary.captureFailures > 0) {
    log.plain("• Verify Storybook is running and accessible");
  }

  if (summary.passed === summary.total && summary.total > 0) {
    log.plain("• All tests passed! 🎉");
  }
}

/**
 * Format file paths for diff viewing
 */
export function formatDiffPaths(screenshotDir: string, testId: string): void {
  const basePath = `${screenshotDir}/base/${testId}.png`;
  const currentPath = `${screenshotDir}/current/${testId}.png`;
  const diffPath = `${screenshotDir}/diff/${testId}.png`;

  log.plain("\n📁 Diff Files:");
  log.plain(`Base:    ${chalk.gray(basePath)}`);
  log.plain(`Current: ${chalk.gray(currentPath)}`);
  log.plain(`Diff:    ${chalk.gray(diffPath)}`);
  log.plain("\nTo view diffs:");
  log.plain(chalk.cyan(`vividiff open ${testId}`));
}

/**
 * Format list of test cases
 */
export function formatTestCases(
  testCases: Array<{
    id: string;
    title: string;
    kind: string;
    browser?: string;
  }>
): void {
  if (testCases.length === 0) {
    log.warn("No test cases found");
    return;
  }

  const data = [
    [
      chalk.cyan("Test ID"),
      chalk.cyan("Title"),
      chalk.cyan("Kind"),
      chalk.cyan("Browser"),
    ],
    ...testCases.map(testCase => [
      testCase.id,
      testCase.title,
      testCase.kind,
      testCase.browser || "-",
    ]),
  ];

  const config = {
    columns: [{ width: 25 }, { width: 35 }, { width: 20 }, { width: 15 }],
    border: {
      topBody: "─",
      topJoin: "┬",
      topLeft: "┌",
      topRight: "┐",
      bottomBody: "─",
      bottomJoin: "┴",
      bottomLeft: "└",
      bottomRight: "┘",
      bodyLeft: "│",
      bodyRight: "│",
      bodyJoin: "│",
      joinBody: "─",
      joinLeft: "├",
      joinRight: "┤",
      joinJoin: "┼",
    },
  };

  log.plain(`\n📋 Found ${testCases.length} test cases:`);
  log.plain(table(data, config));
}
