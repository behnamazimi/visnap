import type { TestCaseInstanceMeta, ViewportMap } from "@vividiff/protocol";

import type { UrlConfig } from "./types.js";

/**
 * Normalizes and expands URL configurations into TestCaseInstanceMeta[].
 * Applies filtering, viewport expansion, and per-URL configuration.
 */
export function normalizeUrls(
  urlConfigs: UrlConfig[],
  options: {
    include?: string | string[];
    exclude?: string | string[];
    viewportKeys: string[];
    globalViewport?: ViewportMap;
  }
): TestCaseInstanceMeta[] {
  const results: TestCaseInstanceMeta[] = [];

  for (const urlConfig of urlConfigs) {
    // Generate test case instances for each viewport
    for (const viewportKey of options.viewportKeys) {
      const viewport = urlConfig.viewport ||
        options.globalViewport?.[viewportKey] || { width: 1920, height: 1080 };

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
        disableCSSInjection: false,
        interactions: urlConfig.interactions,

        // Visual testing config
        visualTesting: {
          skip: false,
          screenshotTarget: urlConfig.screenshotTarget,
          threshold: urlConfig.threshold,
          viewport,
          disableCSSInjection: false,
          interactions: urlConfig.interactions,
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
