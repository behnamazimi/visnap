import { readdirSync } from "fs";
import { join } from "path";

import {
  type TestCaseInstance,
  type VisualTestingToolConfig,
} from "@vividiff/protocol";
import odiff from "odiff-bin";

import { DEFAULT_THRESHOLD } from "@/constants";
import { getErrorMessage } from "@/utils/error-handler";

export interface CompareOptions {
  threshold?: number;
  diffColor?: string;
}

export interface CompareResult {
  id: string;
  match: boolean;
  reason: string;
  diffPercentage?: number;
}

export const compareDirectories = async (
  currentDir: string,
  baseDir: string,
  diffDir: string,
  options: CompareOptions = {}
): Promise<CompareResult[]> => {
  // Build deterministic, sorted union of filenames from current and base
  const currentFiles = new Set(readdirSync(currentDir));
  const baseFiles = new Set(readdirSync(baseDir));
  const allFiles = new Set<string>([...currentFiles, ...baseFiles] as string[]);
  const files = Array.from(allFiles).sort((a, b) => a.localeCompare(b));
  const threshold =
    typeof options.threshold === "number"
      ? options.threshold
      : DEFAULT_THRESHOLD;
  const diffColor = options.diffColor ?? "#00ff00";

  const results: CompareResult[] = [];
  for (const file of files) {
    const currentFile = join(currentDir, file);
    const baseFile = join(baseDir, file);
    const diffFile = join(diffDir, file);
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
    try {
      const diffResult = await odiff.compare(currentFile, baseFile, diffFile, {
        diffColor,
        threshold,
      });
      if (diffResult.match) {
        results.push({ id: file, match: true, reason: "", diffPercentage: 0 });
      } else if (diffResult.reason === "pixel-diff") {
        results.push({
          id: file,
          match: false,
          reason: diffResult.reason,
          diffPercentage: diffResult.diffPercentage,
        });
      } else {
        results.push({
          id: file,
          match: false,
          reason: "error",
          diffPercentage: 0,
        });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const baseNotFound = message.match(
        /Could not load comparison image: (.*)/
      );
      results.push({
        id: file,
        match: false,
        reason: baseNotFound ? "missing-base" : "error",
      });
    }
  }

  return results;
};

/**
 * Compare base and current screenshots with story-level configuration support.
 * This function can handle different thresholds per story.
 */
export const compareBaseAndCurrentWithTestCases = async (
  config: VisualTestingToolConfig,
  testCases: TestCaseInstance[]
): Promise<CompareResult[]> => {
  const { getCurrentDir, getBaseDir, getDiffDir } = await import("@/utils/fs");
  const currentDir = getCurrentDir(config.screenshotDir);
  const baseDir = getBaseDir(config.screenshotDir);
  const diffDir = getDiffDir(config.screenshotDir);

  const defaultThreshold =
    typeof config.threshold === "number" ? config.threshold : DEFAULT_THRESHOLD;

  // Map filename -> threshold (supports per-instance override)
  const idToThreshold = new Map<string, number>();
  for (const t of testCases) {
    const file = `${t.caseId}-${t.variantId}.png`;
    const maybeThreshold = t.threshold;
    if (typeof maybeThreshold === "number") {
      idToThreshold.set(file, maybeThreshold);
    }
  }

  // Get expected files from test cases
  const expectedFiles = new Set(
    testCases.map(t => `${t.caseId}-${t.variantId}.png`)
  );
  
  // Deterministic union of files between current and base, filtered by test cases
  const currentFiles = new Set(readdirSync(currentDir));
  const baseFiles = new Set(readdirSync(baseDir));
  const allFiles = new Set<string>([...currentFiles, ...baseFiles] as string[]);
  const files = Array.from(allFiles)
    .filter(file => expectedFiles.has(file))
    .sort((a, b) => a.localeCompare(b));
  const diffColor = "#00ff00";
  const results: CompareResult[] = [];
  for (const file of files) {
    const currentFile = join(currentDir, file);
    const baseFile = join(baseDir, file);
    const diffFile = join(diffDir, file);
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
    const threshold = idToThreshold.get(file) ?? defaultThreshold;
    try {
      const diffResult = await odiff.compare(currentFile, baseFile, diffFile, {
        diffColor,
        threshold,
      });
      if (diffResult.match) {
        results.push({ id: file, match: true, reason: "", diffPercentage: 0 });
      } else if (diffResult.reason === "pixel-diff") {
        results.push({
          id: file,
          match: false,
          reason: diffResult.reason,
          diffPercentage: diffResult.diffPercentage,
        });
      } else {
        results.push({
          id: file,
          match: false,
          reason: "error",
          diffPercentage: 0,
        });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const baseNotFound = message.match(
        /Could not load comparison image: (.*)/
      );
      results.push({
        id: file,
        match: false,
        reason: baseNotFound ? "missing-base" : "error",
      });
    }
  }

  return results;
};
