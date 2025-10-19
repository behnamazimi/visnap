/**
 * @fileoverview Test case comparison functionality
 */

import type {
  StorageAdapter,
  TestCaseInstance,
  VisualTestingToolConfig,
  ComparisonCore,
} from "@visnap/protocol";
import { SNAPSHOT_EXTENSION } from "@visnap/protocol";

import { createComparisonEngine } from "./utils";

import {
  DEFAULT_THRESHOLD,
  DEFAULT_COMPARISON_CORE,
  DEFAULT_DIFF_COLOR,
} from "@/constants";
import { createConcurrencyPool } from "@/lib/pool";
import { roundToTwoDecimals } from "@/utils/math";

/**
 * Options for image comparison operations.
 */
export interface CompareOptions {
  /** The comparison engine to use for image comparison. */
  comparisonCore: ComparisonCore;
  /** Pixel difference threshold (0-1) for determining matches. */
  threshold?: number;
  /** Color to use for highlighting differences in diff images. */
  diffColor?: string;
}

/**
 * Result of an image comparison operation.
 */
export interface CompareResult {
  /** Unique identifier for the compared file. */
  id: string;
  /** Whether the images match within the threshold. */
  match: boolean;
  /** Reason for the comparison result (e.g., "pixel-diff", "missing-base"). */
  reason: string;
  /** Percentage of pixels that differ (0-100). */
  diffPercentage?: number;
  /** Duration of the comparison operation in milliseconds. */
  comparisonDurationMs?: number;
}

/**
 * Compares test case screenshots with support for per-test-case configuration.
 * @param storage - Storage adapter for accessing image files
 * @param config - Visual testing tool configuration
 * @param testCases - Array of test case instances to compare
 * @returns Promise resolving to array of comparison results
 */
export const compareTestCases = async (
  storage: StorageAdapter,
  config: VisualTestingToolConfig,
  testCases: TestCaseInstance[]
): Promise<CompareResult[]> => {
  // Extract comparison config with defaults
  const comparisonConfig = {
    core: config.comparison?.core ?? DEFAULT_COMPARISON_CORE,
    threshold: config.comparison?.threshold ?? DEFAULT_THRESHOLD,
    diffColor: config.comparison?.diffColor ?? DEFAULT_DIFF_COLOR,
  };

  // Map filename -> threshold (supports per-instance override)
  const idToThreshold = new Map<string, number>();
  for (const testCase of testCases) {
    const file = `${testCase.caseId}-${testCase.variantId}${SNAPSHOT_EXTENSION}`;
    const maybeThreshold = (testCase as unknown as { threshold?: number })
      .threshold;
    if (typeof maybeThreshold === "number") {
      idToThreshold.set(file, maybeThreshold);
    }
  }

  // Only compare files that correspond to the test cases that were actually run
  const expectedFiles = new Set<string>();
  for (const testCase of testCases) {
    expectedFiles.add(
      `${testCase.caseId}-${testCase.variantId}${SNAPSHOT_EXTENSION}`
    );
  }

  // Get files that exist in current and base directories
  const [currentFilesList, baseFilesList] = await Promise.all([
    storage.list("current"),
    storage.list("base"),
  ]);
  const currentFiles = new Set(currentFilesList);
  const baseFiles = new Set(baseFilesList);

  // Only include files that are expected from the test cases
  const files = Array.from(expectedFiles).sort((a, b) => a.localeCompare(b));

  const engine = createComparisonEngine(comparisonConfig.core);
  const maxConcurrencyConfig = config.runtime?.maxConcurrency;
  const compareMax =
    typeof maxConcurrencyConfig === "number"
      ? maxConcurrencyConfig
      : maxConcurrencyConfig?.compare;
  const maxConcurrentCompares = Math.max(1, compareMax ?? 4);
  const runWithPool = createConcurrencyPool({
    concurrency: maxConcurrentCompares,
  });

  const workItems: string[] = files;
  const results = await runWithPool(workItems, async (file, _index) => {
    const inCurrent = currentFiles.has(file);
    const inBase = baseFiles.has(file);

    if (!inCurrent && inBase) {
      return { id: file, match: false, reason: "missing-current" };
    }
    if (inCurrent && !inBase) {
      return { id: file, match: false, reason: "missing-base" };
    }

    const threshold = idToThreshold.get(file) ?? comparisonConfig.threshold;

    const comparisonStartTime = performance.now();
    const diffResult = await engine.compare(storage, file, {
      threshold,
      diffColor: comparisonConfig.diffColor,
    });
    const comparisonDurationMs = roundToTwoDecimals(
      performance.now() - comparisonStartTime
    );

    return {
      id: file,
      match: diffResult.match,
      reason: diffResult.reason,
      diffPercentage: diffResult.diffPercentage,
      comparisonDurationMs,
    };
  });

  return results;
};
