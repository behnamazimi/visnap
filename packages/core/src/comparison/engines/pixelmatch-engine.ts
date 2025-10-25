/**
 * @fileoverview Pixelmatch-based comparison engine for image comparison
 */

import type { StorageAdapter, ComparisonEngine } from "@visnap/protocol";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import { getErrorMessage } from "@/utils/error-handler";

/**
 * Resizes a PNG image to the specified dimensions.
 * @param image - The PNG image to resize
 * @param width - Target width
 * @param height - Target height
 * @returns Resized PNG image
 */
function resizeImage(image: PNG, width: number, height: number): PNG {
  const resized = new PNG({ width, height });
  PNG.bitblt(image, resized, 0, 0, image.width, image.height, 0, 0);
  return resized as PNG;
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
      let currentPng = PNG.sync.read(Buffer.from(currentBuffer)) as any;
      let basePng = PNG.sync.read(Buffer.from(baseBuffer)) as any;

      // Handle dimension mismatches by resizing images
      const maxWidth = Math.max(currentPng.width || 100, basePng.width || 100);
      const maxHeight = Math.max(
        currentPng.height || 100,
        basePng.height || 100
      );

      if (
        currentPng.width !== basePng.width ||
        currentPng.height !== basePng.height
      ) {
        currentPng = resizeImage(currentPng, maxWidth, maxHeight);
        basePng = resizeImage(basePng, maxWidth, maxHeight);
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

      const diffPercentage = (mismatchedPixels / totalPixels) * 100;

      // Only write diff image when there are actual differences
      if (mismatchedPixels > 0) {
        await storage.write("diff", filename, PNG.sync.write(diffPng));
      }

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
  const HEX_COLOR_REGEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
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
