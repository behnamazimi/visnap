/**
 * @fileoverview URL normalization utilities for URL adapter
 *
 * Provides functions for normalizing and expanding URL configurations into
 * test case instances with viewport expansion and safe viewport validation.
 */

import {
  DEFAULT_VIEWPORT,
  type TestCaseInstanceMeta,
  type ViewportMap,
  type FilterOptions,
  type Viewport,
  type InteractionAction,
} from "@visnap/protocol";

import type { UrlConfig } from "./validation";
import { validateUniqueTestCaseIds } from "./validation";

/**
 * Creates a safe viewport with basic validation and fallbacks
 * This is a simplified version of the core createSafeViewport function
 *
 * @param viewport - Viewport configuration to validate
 * @param fallback - Fallback viewport if validation fails
 * @param context - Context string for error messages
 * @returns Validated viewport configuration
 * @throws {Error} If viewport is invalid
 */
function createSafeViewport(
  viewport: unknown | undefined,
  fallback: Viewport = DEFAULT_VIEWPORT,
  context: string = "viewport"
): Viewport {
  if (!viewport) {
    return fallback;
  }

  // Basic validation
  if (typeof viewport !== "object" || viewport === null) {
    throw new Error(`${context} must be an object`);
  }

  const vp = viewport as Record<string, unknown>;

  // Basic type checks
  if (typeof vp.width !== "number" || typeof vp.height !== "number") {
    throw new Error(`${context} must have numeric width and height`);
  }

  return {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor:
      vp.deviceScaleFactor !== undefined ? (vp.deviceScaleFactor as number) : 1,
  };
}

/**
 * Normalizes and expands URL configurations into TestCaseInstanceMeta[].
 * Applies filtering, viewport expansion, and per-URL configuration.
 *
 * @param urlConfigs - Array of URL configurations to normalize
 * @param options - Options including viewport keys and global viewport configuration
 * @returns Array of normalized test case instances
 *
 * @example
 * ```typescript
 * const instances = normalizeUrls(urlConfigs, {
 *   viewportKeys: ["desktop", "mobile"],
 *   globalViewport: {
 *     desktop: { width: 1920, height: 1080 },
 *     mobile: { width: 375, height: 667 }
 *   }
 * });
 * ```
 */
export function normalizeUrls(
  urlConfigs: UrlConfig[],
  options: FilterOptions & {
    viewportKeys: string[];
    globalViewport?: ViewportMap;
  }
): TestCaseInstanceMeta[] {
  const results: TestCaseInstanceMeta[] = [];

  for (const urlConfig of urlConfigs) {
    // Generate test case instances for each viewport
    for (const viewportKey of options.viewportKeys) {
      const viewport = createSafeViewport(
        urlConfig.viewport || options.globalViewport?.[viewportKey],
        { width: 1920, height: 1080, deviceScaleFactor: 1 },
        `URL '${urlConfig.id}' viewport`
      );

      const testCase: TestCaseInstanceMeta = {
        // Base meta fields
        id: generateTestId(urlConfig, viewportKey),
        title: urlConfig.title || urlConfig.id,
        kind: "url",
        parameters: {},
        tags: [],

        // Instance fields
        caseId: urlConfig.id,
        variantId: viewportKey,
        url: urlConfig.url,
        screenshotTarget: urlConfig.screenshotTarget,
        viewport,
        threshold: urlConfig.threshold,
        disableCSSInjection: urlConfig.disableCSSInjection ?? false,
        interactions: urlConfig.interactions as InteractionAction[],
        elementsToMask: urlConfig.elementsToMask,

        // Visual testing config
        visualTesting: {
          skip: false,
          screenshotTarget: urlConfig.screenshotTarget,
          threshold: urlConfig.threshold,
          viewport,
          disableCSSInjection: urlConfig.disableCSSInjection ?? false,
          interactions: urlConfig.interactions as InteractionAction[],
          elementsToMask: urlConfig.elementsToMask,
        },
      };

      results.push(testCase);
    }
  }

  // Validate uniqueness before returning
  validateUniqueTestCaseIds(results);

  return results;
}

/**
 * Generates deterministic test IDs from URL configurations
 * @param urlConfig - URL configuration
 * @param viewportKey - Viewport key for this variant
 * @returns Generated test ID in format "urlId-viewportKey"
 *
 * @example
 * ```typescript
 * const testId = generateTestId(
 *   { id: "homepage", url: "https://example.com" },
 *   "desktop"
 * ); // Returns "homepage-desktop"
 * ```
 */
export function generateTestId(
  urlConfig: UrlConfig,
  viewportKey: string
): string {
  return `${urlConfig.id}-${viewportKey}`;
}

/**
 * Expands URLs across multiple viewport configurations
 * @param urlConfigs - Array of URL configurations to expand
 * @param viewportMap - Map of viewport configurations
 * @returns Array of test case instances expanded across viewports
 *
 * @example
 * ```typescript
 * const instances = expandUrlsForViewports(urlConfigs, {
 *   desktop: { width: 1920, height: 1080 },
 *   mobile: { width: 375, height: 667 }
 * });
 * ```
 */
export function expandUrlsForViewports(
  urlConfigs: UrlConfig[],
  viewportMap: ViewportMap
): TestCaseInstanceMeta[] {
  const viewportKeys = Object.keys(viewportMap).sort();
  if (viewportKeys.length === 0) {
    viewportKeys.push("default");
  }

  return normalizeUrls(urlConfigs, {
    viewportKeys,
    globalViewport: viewportMap,
  });
}
