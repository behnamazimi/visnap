/**
 * @fileoverview Validation utilities for URL adapter
 *
 * Provides ArkType-based validation schemas and functions for URL adapter options
 * and URL configurations with comprehensive error handling.
 */

import type { InteractionAction } from "@visnap/protocol";
import { type } from "arktype";

// ============= Schema Definitions =============

const viewportSchema = type({
  width: "number>0",
  height: "number>0",
  "deviceScaleFactor?": "number>0",
});

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
  "include?": "string|string[]|undefined",
  "exclude?": "string|string[]|undefined",
});

// ============= Type Exports (inferred from schemas) =============

export type Viewport = typeof viewportSchema.infer;

// ============= Type Definitions =============

/**
 * Configuration for a single URL test case
 * @property id - Unique identifier for the URL
 * @property url - Absolute URL to test
 * @property title - Optional human-readable title
 * @property screenshotTarget - CSS selector for element to capture (default: "body")
 * @property elementsToMask - CSS selectors of elements to mask before capture
 * @property viewport - Viewport configuration for this URL
 * @property threshold - Pixel difference threshold for this URL
 * @property disableCSSInjection - Skip injecting global CSS for this URL
 * @property interactions - Actions to perform before capture
 */
export interface UrlConfig {
  id: string;
  url: string;
  title?: string;
  screenshotTarget?: string;
  elementsToMask?: string[];
  viewport?: Viewport;
  threshold?: number;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
}

/**
 * Options for creating a URL adapter
 * @property urls - Array of URL configurations to test
 * @property include - Include patterns for filtering URLs (minimatch)
 * @property exclude - Exclude patterns for filtering URLs (minimatch)
 */
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
 * @param url - URL string to validate
 * @returns True if URL is valid HTTP/HTTPS URL
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
 * @param config - URL configuration to validate
 * @returns Validated URL configuration
 * @throws {Error} If configuration is invalid
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
 * @param options - Options to validate
 * @returns Validated options
 * @throws {Error} If options are invalid
 */
export function validateCreateUrlAdapterOptions(
  options: unknown
): CreateUrlAdapterOptions {
  const result = createUrlAdapterOptionsSchema(options);
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
