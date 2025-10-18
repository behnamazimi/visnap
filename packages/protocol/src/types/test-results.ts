/**
 * @fileoverview Test result types for Visnap visual testing framework
 *
 * This module defines types related to test execution results and outcomes.
 */

import type { ComparisonConfig } from "./comparison";
import type { ViewportMap } from "./core";

/**
 * Detailed information about a single test case execution
 * @property id - Test case identifier
 * @property captureFilename - Name of the captured screenshot file
 * @property captureDurationMs - Time taken to capture screenshot
 * @property comparisonDurationMs - Time taken to compare images
 * @property totalDurationMs - Total time for this test case
 * @property status - Test case status
 * @property reason - Failure reason if status is not "passed"
 * @property diffPercentage - Percentage of pixels that differ (if applicable)
 * @property title - Human-readable test case title
 * @property kind - Test case type (e.g., "story", "url")
 * @property browser - Browser used for this test case
 * @property viewport - Viewport configuration used
 */
export interface TestCaseDetail {
  id: string;
  captureFilename: string;
  captureDurationMs: number;
  comparisonDurationMs?: number;
  totalDurationMs: number;
  status: "passed" | "failed" | "capture-failed";
  reason?: string;
  diffPercentage?: number;
  title?: string;
  kind?: string;
  browser?: string;
  viewport?: string;
}

/**
 * Duration statistics for a test run
 * @property totalCaptureDurationMs - Total time spent capturing screenshots
 * @property totalComparisonDurationMs - Total time spent comparing images
 * @property totalDurationMs - Total time for the entire test run
 */
export interface TestDurations {
  totalCaptureDurationMs: number;
  totalComparisonDurationMs: number;
  totalDurationMs: number;
}

/**
 * Aggregate outcome for a test run to aid CI reporting
 * @property total - Total number of test cases
 * @property passed - Number of test cases that passed
 * @property failedDiffs - Number of test cases that failed due to pixel differences
 * @property failedMissingCurrent - Number of test cases missing current screenshots
 * @property failedMissingBase - Number of test cases missing baseline screenshots
 * @property failedErrors - Number of test cases that failed due to errors
 * @property captureFailures - Number of captures that failed before comparison
 * @property testCases - Detailed information about each test case
 * @property durations - Duration statistics for the test run
 */
export interface RunOutcome {
  total: number;
  passed: number;
  failedDiffs: number;
  failedMissingCurrent: number;
  failedMissingBase: number;
  failedErrors: number; // non-standard errors
  captureFailures: number; // number of captures that failed prior to compare
  testCases?: TestCaseDetail[];
  durations?: TestDurations;
}

/**
 * Complete test result containing outcome, failures, and configuration
 * @property success - Whether all tests passed
 * @property outcome - Detailed outcome statistics
 * @property exitCode - Process exit code (0 for success, 1 for failure)
 * @property failures - Array of test failures with diff details
 * @property captureFailures - Array of capture failures with error details
 * @property config - Configuration used for the test run
 */
export interface TestResult {
  success: boolean;
  outcome: RunOutcome;
  exitCode: number;
  failures?: Array<{
    id: string;
    reason: string;
    diffPercentage?: number;
  }>;
  captureFailures?: Array<{
    id: string;
    error: string;
  }>;
  config?: {
    screenshotDir?: string;
    adapters?: {
      browser?: { name: string; options?: Record<string, unknown> };
      testCase?: Array<{ name: string; options?: Record<string, unknown> }>;
    };
    comparison?: ComparisonConfig;
    runtime?: {
      maxConcurrency?: number | { capture?: number; compare?: number };
      quiet?: boolean;
    };
    viewport?: ViewportMap;
    reporter?: {
      html?: boolean | string;
      json?: boolean | string;
    };
  };
}
