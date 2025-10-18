/**
 * @fileoverview Directory comparison functionality
 */

import type { StorageAdapter } from "@visnap/protocol";

import type { CompareOptions, CompareResult } from "./test-case-comparer";
import { createComparisonEngine } from "./utils";

import { DEFAULT_THRESHOLD, DEFAULT_DIFF_COLOR } from "@/constants";

// CompareOptions and CompareResult are defined in test-case-comparer.ts

/**
 * Compares all images in current and base directories.
 * @param storage - Storage adapter for accessing image files
 * @param options - Comparison options
 * @returns Promise resolving to array of comparison results
 */
export const compareDirectories = async (
  storage: StorageAdapter,
  options: CompareOptions
): Promise<CompareResult[]> => {
  // Build deterministic, sorted union of filenames from current and base
  const [currentFilesList, baseFilesList] = await Promise.all([
    storage.list("current"),
    storage.list("base"),
  ]);
  const currentFiles = new Set(currentFilesList);
  const baseFiles = new Set(baseFilesList);
  const allFiles = new Set<string>([...currentFiles, ...baseFiles] as string[]);
  const files = Array.from(allFiles).sort((a, b) => a.localeCompare(b));

  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const diffColor = options.diffColor ?? DEFAULT_DIFF_COLOR;

  const engine = createComparisonEngine(options.comparisonCore);
  const results: CompareResult[] = [];

  for (const file of files) {
    const inCurrent = currentFiles.has(file);
    const inBase = baseFiles.has(file);

    if (!inCurrent && inBase) {
      results.push({ id: file, match: false, reason: "missing-current" });
      continue;
    }
    if (inCurrent && !inBase) {
      results.push({ id: file, match: false, reason: "missing-base" });
      continue;
    }

    const diffResult = await engine.compare(storage, file, {
      threshold,
      diffColor,
    });

    results.push({
      id: file,
      match: diffResult.match,
      reason: diffResult.reason,
      diffPercentage: diffResult.diffPercentage,
    });
  }

  return results;
};
