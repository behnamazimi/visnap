import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

// Module-level regex for hex color validation
const HEX_COLOR_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

import {
  type TestCaseInstance,
  type VisualTestingToolConfig,
  type ComparisonCore,
  type ComparisonConfig,
  type ComparisonEngine,
} from "@vividiff/protocol";
import odiff from "odiff-bin";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import {
  DEFAULT_THRESHOLD,
  DEFAULT_COMPARISON_CORE,
  DEFAULT_DIFF_COLOR,
} from "@/constants";
import { getErrorMessage } from "@/utils/error-handler";
import { roundToTwoDecimals } from "@/utils/math";

export interface CompareOptions {
  comparisonCore: ComparisonCore;
  threshold?: number;
  diffColor?: string;
}

export interface CompareResult {
  id: string;
  match: boolean;
  reason: string;
  diffPercentage?: number;
  comparisonDurationMs?: number;
}

export class OdiffEngine implements ComparisonEngine {
  name = "odiff";
  async compare(
    currentFile: string,
    baseFile: string,
    diffFile: string,
    options: { threshold: number; diffColor?: string }
  ): Promise<{ match: boolean; reason: string; diffPercentage?: number }> {
    try {
      const diffResult = await odiff.compare(currentFile, baseFile, diffFile, {
        diffColor: options.diffColor ?? DEFAULT_DIFF_COLOR,
        threshold: options.threshold,
      });

      if (diffResult.match) {
        return { match: true, reason: "", diffPercentage: 0 };
      } else if (diffResult.reason === "pixel-diff") {
        return {
          match: false,
          reason: diffResult.reason,
          diffPercentage: diffResult.diffPercentage,
        };
      } else {
        return {
          match: false,
          reason: "error",
          diffPercentage: 0,
        };
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const baseNotFound = message.match(
        /Could not load comparison image: (.*)/
      );
      if (baseNotFound) {
        return {
          match: false,
          reason: "missing-base",
          diffPercentage: 0,
        };
      }
      return {
        match: false,
        reason: "error",
        diffPercentage: 0,
      };
    }
  }
}

export class PixelmatchEngine implements ComparisonEngine {
  name = "pixelmatch";
  async compare(
    currentFile: string,
    baseFile: string,
    diffFile: string,
    options: { threshold: number; diffColor?: string }
  ): Promise<{ match: boolean; reason: string; diffPercentage?: number }> {
    try {
      // Read and decode PNG files
      const [currentBuffer, baseBuffer] = await Promise.all([
        readFile(currentFile),
        readFile(baseFile),
      ]);
      const currentPng = PNG.sync.read(currentBuffer);
      const basePng = PNG.sync.read(baseBuffer);

      // Ensure images have same dimensions
      if (
        currentPng.width !== basePng.width ||
        currentPng.height !== basePng.height
      ) {
        return {
          match: false,
          reason: "error",
          diffPercentage: 0,
        };
      }

      const { width, height } = currentPng;
      const totalPixels = width * height;

      // Create diff image buffer
      const diffPng = new PNG({ width, height });

      // Compare images using pixelmatch
      const mismatchedPixels = pixelmatch(
        currentPng.data,
        basePng.data,
        diffPng.data,
        width,
        height,
        {
          threshold: options.threshold,
          diffColor: options.diffColor
            ? hexToRgb(options.diffColor)
            : undefined,
        }
      );

      // Write diff image
      await writeFile(diffFile, PNG.sync.write(diffPng));

      const diffPercentage = (mismatchedPixels / totalPixels) * 100;

      return {
        match: mismatchedPixels === 0,
        reason: mismatchedPixels === 0 ? "" : "pixel-diff",
        diffPercentage,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes("ENOENT") && message.includes(baseFile)) {
        return {
          match: false,
          reason: "missing-base",
          diffPercentage: 0,
        };
      }
      return {
        match: false,
        reason: "error",
        diffPercentage: 0,
      };
    }
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = HEX_COLOR_REGEX.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function createComparisonEngine(core: ComparisonCore): ComparisonEngine {
  // Import registry and register built-in engines if not already done
  import("../utils/comparison-engine-registry").then(
    ({ comparisonEngineRegistry, registerBuiltInEngines }) => {
      if (!comparisonEngineRegistry.has(core)) {
        registerBuiltInEngines();
      }
    }
  );

  // For now, fall back to the old switch statement
  // TODO: Replace with registry lookup once async initialization is handled
  switch (core) {
    case "odiff":
      return new OdiffEngine();
    case "pixelmatch":
      return new PixelmatchEngine();
    default:
      throw new Error(`Unsupported comparison core: ${core}`);
  }
}

export const compareDirectories = async (
  currentDir: string,
  baseDir: string,
  diffDir: string,
  options: CompareOptions
): Promise<CompareResult[]> => {
  // Build deterministic, sorted union of filenames from current and base
  const [currentFilesList, baseFilesList] = await Promise.all([
    readdir(currentDir),
    readdir(baseDir),
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

    const diffResult = await engine.compare(currentFile, baseFile, diffFile, {
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

/**
 * Compare base and current screenshots with story-level configuration support.
 * This function can handle different thresholds per story.
 */
export const compareTestCases = async (
  config: VisualTestingToolConfig,
  testCases: TestCaseInstance[]
): Promise<CompareResult[]> => {
  const { getCurrentDir, getBaseDir, getDiffDir } = await import("@/utils/fs");

  const currentDir = getCurrentDir(config.screenshotDir);
  const baseDir = getBaseDir(config.screenshotDir);
  const diffDir = getDiffDir(config.screenshotDir);

  // Extract comparison config with defaults
  const comparisonConfig: ComparisonConfig = {
    core: config.comparison?.core ?? DEFAULT_COMPARISON_CORE,
    threshold: config.comparison?.threshold ?? DEFAULT_THRESHOLD,
    diffColor: config.comparison?.diffColor ?? DEFAULT_DIFF_COLOR,
  };

  // Map filename -> threshold (supports per-instance override)
  const idToThreshold = new Map<string, number>();
  for (const t of testCases) {
    const file = `${t.caseId}-${t.variantId}.png`;
    const maybeThreshold = (t as unknown as { threshold?: number }).threshold;
    if (typeof maybeThreshold === "number") {
      idToThreshold.set(file, maybeThreshold);
    }
  }

  // Only compare files that correspond to the test cases that were actually run
  const expectedFiles = new Set<string>();
  for (const testCase of testCases) {
    expectedFiles.add(`${testCase.caseId}-${testCase.variantId}.png`);
  }

  // Get files that exist in current and base directories
  const [currentFilesList, baseFilesList] = await Promise.all([
    readdir(currentDir),
    readdir(baseDir),
  ]);
  const currentFiles = new Set(currentFilesList);
  const baseFiles = new Set(baseFilesList);

  // Only include files that are expected from the test cases
  const files = Array.from(expectedFiles).sort((a, b) => a.localeCompare(b));

  const engine = createComparisonEngine(comparisonConfig.core);
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

    const threshold = idToThreshold.get(file) ?? comparisonConfig.threshold;

    const comparisonStartTime = performance.now();
    const diffResult = await engine.compare(currentFile, baseFile, diffFile, {
      threshold,
      diffColor: comparisonConfig.diffColor,
    });
    const comparisonDurationMs = roundToTwoDecimals(
      performance.now() - comparisonStartTime
    );

    results.push({
      id: file,
      match: diffResult.match,
      reason: diffResult.reason,
      diffPercentage: diffResult.diffPercentage,
      comparisonDurationMs,
    });
  }

  return results;
};
