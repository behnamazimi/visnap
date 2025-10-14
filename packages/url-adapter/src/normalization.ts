import {
  DEFAULT_VIEWPORT,
  type TestCaseInstanceMeta,
  type ViewportMap,
  type FilterOptions,
  type Viewport,
} from "@visnap/protocol";

import type { UrlConfig } from "./types.js";

/**
 * Creates a safe viewport with basic validation and fallbacks
 * This is a simplified version of the core createSafeViewport function
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
    ...(vp.deviceScaleFactor !== undefined && {
      deviceScaleFactor: vp.deviceScaleFactor as number,
    }),
  };
}

/**
 * Normalizes and expands URL configurations into TestCaseInstanceMeta[].
 * Applies filtering, viewport expansion, and per-URL configuration.
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
        { width: 1920, height: 1080 },
        `URL '${urlConfig.id}' viewport`
      );

      const testCase: TestCaseInstanceMeta = {
        // Base meta fields
        id: urlConfig.id,
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
        interactions: urlConfig.interactions,
        elementsToMask: urlConfig.elementsToMask,

        // Visual testing config
        visualTesting: {
          skip: false,
          screenshotTarget: urlConfig.screenshotTarget,
          threshold: urlConfig.threshold,
          viewport,
          disableCSSInjection: urlConfig.disableCSSInjection ?? false,
          interactions: urlConfig.interactions,
          elementsToMask: urlConfig.elementsToMask,
        },
      };

      results.push(testCase);
    }
  }

  return results;
}

/**
 * Generates deterministic test IDs from URL configurations
 */
export function generateTestId(
  urlConfig: UrlConfig,
  viewportKey: string
): string {
  return `${urlConfig.id}-${viewportKey}`;
}

/**
 * Expands URLs across multiple viewport configurations
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
