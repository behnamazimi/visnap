import type { FilterOptions } from "@visnap/protocol";
import { type } from "arktype";
import { minimatch } from "minimatch";

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

// ============= ArkType Schemas =============

const viewportSchema = type({
  width: "number>0",
  height: "number>0",
  "deviceScaleFactor?": "number>0",
});

// const interactionActionSchema = type("object"); // Not used currently

const urlConfigSchema = type({
  id: "string>0",
  url: "string>0",
  "title?": "string",
  "screenshotTarget?": "string",
  "elementsToMask?": "string[]",
  "viewport?": viewportSchema,
  "threshold?": "number",
  "disableCSSInjection?": "boolean",
  "interactions?": "object[]",
});

const createUrlAdapterOptionsSchema = type({
  urls: "object[]",
  include: "string|string[]?",
  exclude: "string|string[]?",
});

// ============= Type Exports (inferred from schemas) =============

export type Viewport = typeof viewportSchema.infer;
export type InteractionAction = object; // Simplified type for interactions

// ============= Type Definitions =============

export interface UrlConfig {
  id: string;
  url: string;
  title?: string;
  screenshotTarget?: string;
  elementsToMask?: string[];
  viewport?: Viewport;
  threshold?: number;
  disableCSSInjection?: boolean;
  interactions?: object[];
}

export interface CreateUrlAdapterOptions {
  urls: UrlConfig[];
  include?: string | string[];
  exclude?: string | string[];
}

// Re-export types for compatibility
export type { FilterOptions } from "@visnap/protocol";

// ============= Validation Functions =============

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
 * Validates URL configuration using ArkType
 */
export function validateUrlConfig(config: unknown): UrlConfig {
  const result = urlConfigSchema(config);
  if (result instanceof type.errors) {
    throw new Error(`Invalid URL config: ${result.summary}`);
  }

  // Additional URL format validation
  if (!isValidUrl(result.url)) {
    throw new Error(`URL '${result.url}' is not a valid HTTP/HTTPS URL`);
  }

  return result as UrlConfig;
}

/**
 * Validates create URL adapter options
 */
export function validateCreateUrlAdapterOptions(
  opts: unknown
): CreateUrlAdapterOptions {
  const result = createUrlAdapterOptionsSchema(opts);
  if (result instanceof type.errors) {
    throw new Error(`Invalid URL adapter options: ${result.summary}`);
  }

  // Validate that at least one URL is provided
  if (result.urls.length === 0) {
    throw new Error("At least one URL must be provided");
  }

  // Validate each URL config
  for (const urlConfig of result.urls as UrlConfig[]) {
    validateUrlConfig(urlConfig);
  }

  return result as CreateUrlAdapterOptions;
}
