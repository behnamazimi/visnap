/**
 * @fileoverview URL adapter for Visnap visual testing framework
 *
 * URL-based TestCaseAdapter that can test any absolute URL without requiring a server.
 * Supports include/exclude filtering, viewport expansion, and per-URL configuration.
 */

import type {
  TestCaseAdapter,
  TestCaseInstanceMeta,
  ViewportMap,
  PageWithEvaluate,
} from "@visnap/protocol";

import { createUrlFilter } from "./filtering";
import { normalizeUrls } from "./normalization";
import type { CreateUrlAdapterOptions } from "./validation";
import { validateCreateUrlAdapterOptions } from "./validation";

/**
 * Creates a URL-based TestCaseAdapter that can:
 * - Test any absolute URL without requiring a server
 * - Apply include/exclude filtering using minimatch patterns
 * - Expand URLs across multiple viewport configurations
 * - Support per-URL configuration (viewport, threshold, interactions)
 *
 * @param options - Configuration options for the URL adapter
 * @returns A TestCaseAdapter instance configured for URL testing
 *
 * @example
 * ```typescript
 * const adapter = createAdapter({
 *   urls: [
 *     { id: "homepage", url: "https://example.com" },
 *     { id: "about", url: "https://example.com/about" }
 *   ],
 *   include: ["homepage"],
 *   exclude: ["*test*"]
 * });
 * ```
 */
export function createAdapter(
  options: CreateUrlAdapterOptions
): TestCaseAdapter {
  // Validate options using ArkType schema
  const validatedOptions = validateCreateUrlAdapterOptions(options);

  // Create filter function
  const filter = createUrlFilter({
    include: validatedOptions.include,
    exclude: validatedOptions.exclude,
  });

  // Filter URLs
  const filteredUrls = validatedOptions.urls.filter(filter);

  if (filteredUrls.length === 0) {
    console.warn("No URLs match the include/exclude patterns");
  }

  return {
    name: "url-adapter",

    /**
     * Start the adapter and provide initial page URL for discovery
     * @returns Promise resolving to adapter start result with initial page URL
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
     *
     * @param _pageCtx - Page context (not used for URL adapter)
     * @param o - Options including viewport configuration
     * @returns Promise resolving to array of test case instances
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
        include: validatedOptions.include,
        exclude: validatedOptions.exclude,
        viewportKeys,
        globalViewport: o?.viewport,
      });
    },

    /**
     * No stop() needed - no server to manage
     * @returns Promise resolving immediately
     */
    async stop() {
      // No cleanup needed
    },
  };
}

// Re-export types for convenience
export type { CreateUrlAdapterOptions, UrlConfig } from "./validation";
