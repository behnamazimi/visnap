/**
 * @fileoverview Image comparison and testing utilities
 *
 * Comparison engines for different backends (odiff, pixelmatch) and functions
 * for comparing test cases and directories.
 */

import type {
  StorageAdapter,
  TestCaseInstance,
  VisualTestingToolConfig,
  ComparisonCore,
  ComparisonConfig,
  ComparisonEngine,
} from "@visnap/protocol";

import { createConcurrencyPool } from "@/lib/pool";

import {
  comparisonEngineRegistry,
  registerBuiltInEngines,
} from "./comparison-engine-registry";

// Module-level regex for hex color validation
const HEX_COLOR_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

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
 * Odiff-based comparison engine for image comparison.
 */
export class OdiffEngine implements ComparisonEngine {
  name = "odiff";

  /**
   * Compares two images using the odiff engine.
   * @param storage - Storage adapter for accessing image files
   * @param filename - Name of the image file to compare
   * @param options - Comparison options including threshold and diff color
   * @returns Promise resolving to comparison result
   */
  async compare(
    storage: StorageAdapter,
    filename: string,
    options: { threshold: number; diffColor?: string }
  ): Promise<{ match: boolean; reason: string; diffPercentage?: number }> {
    try {
      // Get readable paths for odiff (it expects file paths)
      const currentFile = await storage.getReadablePath("current", filename);
      const baseFile = await storage.getReadablePath("base", filename);
      const diffFile = await storage.getReadablePath("diff", filename);

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

/**
 * Pixelmatch-based comparison engine for image comparison.
 */
export class PixelmatchEngine implements ComparisonEngine {
  name = "pixelmatch";

  /**
   * Compares two images using the pixelmatch engine.
   * @param storage - Storage adapter for accessing image files
   * @param filename - Name of the image file to compare
   * @param options - Comparison options including threshold and diff color
   * @returns Promise resolving to comparison result
   */
  async compare(
    storage: StorageAdapter,
    filename: string,
    options: { threshold: number; diffColor?: string }
  ): Promise<{ match: boolean; reason: string; diffPercentage?: number }> {
    try {
      // Read and decode PNG files using storage adapter
      const [currentBuffer, baseBuffer] = await Promise.all([
        storage.read("current", filename),
        storage.read("base", filename),
      ]);
      const currentPng = PNG.sync.read(Buffer.from(currentBuffer));
      const basePng = PNG.sync.read(Buffer.from(baseBuffer));

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

      // Write diff image using storage adapter
      await storage.write("diff", filename, PNG.sync.write(diffPng));

      const diffPercentage = (mismatchedPixels / totalPixels) * 100;

      return {
        match: mismatchedPixels === 0,
        reason: mismatchedPixels === 0 ? "" : "pixel-diff",
        diffPercentage,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      if (message.includes("ENOENT") || message.includes("not found")) {
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

/**
 * Converts a hex color string to RGB values.
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns RGB values as a tuple
 * @throws {Error} If the hex string is invalid
 */
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

/**
 * Creates a comparison engine instance based on the specified core.
 * @param core - The comparison core to use
 * @returns Comparison engine instance
 * @throws {Error} If the comparison core is not supported
 */
function createComparisonEngine(core: ComparisonCore): ComparisonEngine {
  if (!comparisonEngineRegistry.has(core)) {
    registerBuiltInEngines();
  }

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

/**
 * Compares test case screenshots with support for per-story configuration.
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
  const comparisonConfig: ComparisonConfig = {
    core: config.comparison?.core ?? DEFAULT_COMPARISON_CORE,
    threshold: config.comparison?.threshold ?? DEFAULT_THRESHOLD,
    diffColor: config.comparison?.diffColor ?? DEFAULT_DIFF_COLOR,
  };

  // Map filename -> threshold (supports per-instance override)
  const idToThreshold = new Map<string, number>();
  for (const testCase of testCases) {
    const file = `${testCase.caseId}-${testCase.variantId}.png`;
    const maybeThreshold = (testCase as unknown as { threshold?: number })
      .threshold;
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
