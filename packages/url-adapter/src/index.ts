import type {
  TestCaseAdapter,
  TestCaseInstanceMeta,
  ViewportMap,
  PageWithEvaluate,
} from "@visnap/protocol";

import type { CreateUrlAdapterOptions } from "./filtering";
import { createUrlFilter, validateCreateUrlAdapterOptions } from "./filtering";
import { normalizeUrls } from "./normalization";

/**
 * Creates a URL-based TestCaseAdapter that can:
 * - Test any absolute URL without requiring a server
 * - Apply include/exclude filtering using minimatch patterns
 * - Expand URLs across multiple viewport configurations
 * - Support per-URL configuration (viewport, threshold, interactions)
 *
 * The returned API shape matches `TestCaseAdapter` and is preserved.
 */
export function createAdapter(opts: CreateUrlAdapterOptions): TestCaseAdapter {
  // Validate options using ArkType schema
  const validatedOpts = validateCreateUrlAdapterOptions(opts);

  // Create filter function
  const filter = createUrlFilter({
    include: validatedOpts.include,
    exclude: validatedOpts.exclude,
  });

  // Filter URLs
  const filteredUrls = validatedOpts.urls.filter(filter);

  if (filteredUrls.length === 0) {
    console.warn("No URLs match the include/exclude patterns");
  }

  return {
    name: "url-adapter",

    /**
     * Start the adapter and provide initial page URL for discovery
     */
    async start() {
      return {
        // Provide the first URL as initial page URL for discovery
        initialPageUrl: filteredUrls[0]?.url,
      };
    },

    /**
     * Lists normalized and filtered URLs as test case instances.
     * No page context needed since URLs are absolute.
     */
    async listCases(
      _pageCtx?: PageWithEvaluate,
      o?: { viewport?: ViewportMap }
    ): Promise<TestCaseInstanceMeta[]> {
      // Determine viewport keys
      let viewportKeys = o?.viewport ? Object.keys(o.viewport) : ["default"];
      if (!viewportKeys || viewportKeys.length === 0) {
        viewportKeys = ["default"];
      }

      // Sort viewport keys deterministically
      viewportKeys.sort((a, b) => a.localeCompare(b));

      // Normalize URLs to test case instances
      return normalizeUrls(filteredUrls, {
        include: validatedOpts.include,
        exclude: validatedOpts.exclude,
        viewportKeys,
        globalViewport: o?.viewport,
      });
    },

    /**
     * No stop() needed - no server to manage
     */
    async stop() {
      // No cleanup needed
    },
  };
}

// Re-export types for convenience
export type { CreateUrlAdapterOptions, UrlConfig } from "./filtering";
