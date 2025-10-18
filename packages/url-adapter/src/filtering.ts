/**
 * @fileoverview URL filtering utilities for URL adapter
 *
 * Provides filtering functionality for URL test cases using minimatch patterns
 * for include/exclude filtering with comprehensive pattern matching support.
 */

import type { FilterOptions } from "@visnap/protocol";
import { minimatch } from "minimatch";

import type { UrlConfig } from "./validation";

/**
 * Creates a predicate function that filters URLs by include and exclude patterns.
 * Patterns support minimatch wildcards. Invalid patterns are ignored.
 *
 * @param opts - Filter options with include and exclude patterns
 * @returns Predicate function that returns true if URL should be included
 *
 * @example
 * ```typescript
 * const filter = createUrlFilter({
 *   include: ["homepage", "about*"],
 *   exclude: ["*test*", "admin*"]
 * });
 *
 * const shouldInclude = filter({ id: "homepage", url: "https://example.com" });
 * ```
 */
export function createUrlFilter(opts: FilterOptions) {
  const includePatterns = Array.isArray(opts.include)
    ? opts.include
    : opts.include
      ? [opts.include]
      : [];
  const excludePatterns = Array.isArray(opts.exclude)
    ? opts.exclude
    : opts.exclude
      ? [opts.exclude]
      : [];

  return (urlConfig: UrlConfig) => {
    const urlId = urlConfig.id;

    // Check include patterns
    if (includePatterns.length > 0) {
      const matchesInclude = includePatterns.some(pattern =>
        minimatch(urlId, pattern)
      );
      if (!matchesInclude) return false;
    }

    // Check exclude patterns
    if (excludePatterns.length > 0) {
      const matchesExclude = excludePatterns.some(pattern =>
        minimatch(urlId, pattern)
      );
      if (matchesExclude) return false;
    }

    return true;
  };
}

// Re-export types from validation module
export type {
  UrlConfig,
  CreateUrlAdapterOptions,
  Viewport,
  InteractionAction,
} from "./validation";
