/**
 * @fileoverview Odiff-based comparison engine for image comparison
 */

import type { StorageAdapter, ComparisonEngine } from "@visnap/protocol";
import odiff from "odiff-bin";

import { DEFAULT_DIFF_COLOR } from "@/constants";
import { getErrorMessage } from "@/utils/error-handler";

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
