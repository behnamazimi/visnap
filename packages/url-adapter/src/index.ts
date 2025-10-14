import type {
  TestCaseAdapter,
  TestCaseInstanceMeta,
  ViewportMap,
  PageWithEvaluate,
} from "@visnap/protocol";

import { createUrlFilter, validateUrlConfig } from "./filtering.js";
import { normalizeUrls } from "./normalization.js";
import type { CreateUrlAdapterOptions } from "./types.js";

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
  if (!opts || !Array.isArray(opts.urls)) {
    throw new Error(
      "Invalid options provided to createAdapter: 'urls' array is required"
    );
  }

  if (opts.urls.length === 0) {
    throw new Error("At least one URL must be provided");
  }

  // Validate all URL configurations
  const validationErrors: string[] = [];
  for (const urlConfig of opts.urls) {
    const errors = validateUrlConfig(urlConfig);
    if (errors.length > 0) {
      validationErrors.push(
        ...errors.map(error => `URL '${urlConfig.id}': ${error}`)
      );
    }
  }

  if (validationErrors.length > 0) {
    throw new Error(
      `URL configuration validation failed:\n${validationErrors.join("\n")}`
    );
  }

  // Create filter function
  const filter = createUrlFilter({
    include: opts.include,
    exclude: opts.exclude,
  });

  // Filter URLs
  const filteredUrls = opts.urls.filter(filter);

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
        include: opts.include,
        exclude: opts.exclude,
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
export type { CreateUrlAdapterOptions, UrlConfig } from "./types.js";
