import type { FilterOptions } from "@visnap/protocol";
import { minimatch } from "minimatch";

import type { UrlConfig } from "./types.js";

/**
 * Creates a predicate function that filters URLs by include and exclude patterns.
 * Patterns support minimatch wildcards. Invalid patterns are ignored.
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

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates URL configuration
 */
export function validateUrlConfig(config: UrlConfig): string[] {
  const errors: string[] = [];

  if (!config.id || typeof config.id !== "string") {
    errors.push("URL config must have a valid 'id' field");
  }

  if (!config.url || typeof config.url !== "string") {
    errors.push("URL config must have a valid 'url' field");
  } else if (!isValidUrl(config.url)) {
    errors.push(`URL '${config.url}' is not a valid HTTP/HTTPS URL`);
  }

  if (config.title && typeof config.title !== "string") {
    errors.push("URL config 'title' must be a string");
  }

  if (config.screenshotTarget && typeof config.screenshotTarget !== "string") {
    errors.push("URL config 'screenshotTarget' must be a string");
  }

  if (
    config.threshold !== undefined &&
    (typeof config.threshold !== "number" ||
      config.threshold < 0 ||
      config.threshold > 1)
  ) {
    errors.push("URL config 'threshold' must be a number between 0 and 1");
  }

  if (
    config.viewport &&
    (typeof config.viewport !== "object" ||
      typeof config.viewport.width !== "number" ||
      typeof config.viewport.height !== "number" ||
      config.viewport.width <= 0 ||
      config.viewport.height <= 0)
  ) {
    errors.push(
      "URL config 'viewport' must have valid width and height numbers"
    );
  }

  if (config.interactions && !Array.isArray(config.interactions)) {
    errors.push("URL config 'interactions' must be an array");
  }

  if (
    config.disableCSSInjection !== undefined &&
    typeof config.disableCSSInjection !== "boolean"
  ) {
    errors.push("URL config 'disableCSSInjection' must be a boolean");
  }

  return errors;
}
