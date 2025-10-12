import type { Viewport } from "@vividiff/protocol";

// Default viewport configuration
export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };
export const MIN_VIEWPORT_DIMENSION = 1;
export const MAX_VIEWPORT_DIMENSION = 10000;
export const MIN_DEVICE_SCALE_FACTOR = 0.1;
export const MAX_DEVICE_SCALE_FACTOR = 10;

/**
 * Validates viewport dimensions and properties
 */
export function validateViewport(
  viewport: unknown,
  context: string = "viewport"
): Viewport {
  if (!viewport || typeof viewport !== "object") {
    throw new Error(`${context} must be an object`);
  }

  const vp = viewport as Record<string, unknown>;

  // Validate width
  if (typeof vp.width !== "number" || !Number.isInteger(vp.width)) {
    throw new Error(`${context}.width must be an integer`);
  }
  if (vp.width < MIN_VIEWPORT_DIMENSION || vp.width > MAX_VIEWPORT_DIMENSION) {
    throw new Error(
      `${context}.width must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
    );
  }

  // Validate height
  if (typeof vp.height !== "number" || !Number.isInteger(vp.height)) {
    throw new Error(`${context}.height must be an integer`);
  }
  if (
    vp.height < MIN_VIEWPORT_DIMENSION ||
    vp.height > MAX_VIEWPORT_DIMENSION
  ) {
    throw new Error(
      `${context}.height must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
    );
  }

  // Validate deviceScaleFactor if present
  if (vp.deviceScaleFactor !== undefined) {
    if (typeof vp.deviceScaleFactor !== "number") {
      throw new Error(`${context}.deviceScaleFactor must be a number`);
    }
    if (
      vp.deviceScaleFactor < MIN_DEVICE_SCALE_FACTOR ||
      vp.deviceScaleFactor > MAX_DEVICE_SCALE_FACTOR
    ) {
      throw new Error(
        `${context}.deviceScaleFactor must be between ${MIN_DEVICE_SCALE_FACTOR} and ${MAX_DEVICE_SCALE_FACTOR}`
      );
    }
  }

  return {
    width: vp.width,
    height: vp.height,
    ...(vp.deviceScaleFactor !== undefined && {
      deviceScaleFactor: vp.deviceScaleFactor,
    }),
  };
}

/**
 * Creates a safe viewport with validation and fallbacks
 */
export function createSafeViewport(
  viewport: unknown | undefined,
  fallback: Viewport = DEFAULT_VIEWPORT,
  context: string = "viewport"
): Viewport {
  if (!viewport) {
    return fallback;
  }

  try {
    return validateViewport(viewport, context);
  } catch (error) {
    throw new Error(
      `Invalid ${context}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
