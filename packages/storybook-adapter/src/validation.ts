/**
 * @fileoverview Validation utilities for Storybook adapter
 *
 * Provides ArkType-based validation schemas and functions for Storybook adapter options
 * and discovery configuration with comprehensive error handling.
 */

import { type } from "arktype";

// ============= Schema Definitions =============

const discoveryConfigSchema = type({
  evalTimeoutMs: "number>0?",
  maxRetries: "number>=0?",
  retryDelayMs: "number>=0?",
});

const createStorybookAdapterOptionsSchema = type({
  source: "string>0",
  port: "number>0?",
  include: "string|string[]?",
  exclude: "string|string[]?",
  "discovery?": discoveryConfigSchema,
});

// ============= Type Exports (inferred from schemas) =============

export type DiscoveryConfig = typeof discoveryConfigSchema.infer;
export type CreateStorybookAdapterOptions =
  typeof createStorybookAdapterOptionsSchema.infer;

// ============= Validation Functions =============

/**
 * Validates discovery configuration
 */
export function validateDiscoveryConfig(discovery: unknown): DiscoveryConfig {
  const result = discoveryConfigSchema(discovery);
  if (result instanceof type.errors) {
    throw new Error(`Invalid discovery config: ${result.summary}`);
  }
  return result;
}

/**
 * Validates create storybook adapter options
 */
export function validateOptions(
  options: unknown
): CreateStorybookAdapterOptions {
  const result = createStorybookAdapterOptionsSchema(options);
  if (result instanceof type.errors) {
    throw new Error(`Invalid storybook adapter options: ${result.summary}`);
  }

  // Additional validation for whitespace-only source
  if (result.source.trim() === "") {
    throw new Error(
      "Invalid storybook adapter options: source must be non-empty"
    );
  }

  return result;
}

// ============= Schema Exports =============

export { discoveryConfigSchema, createStorybookAdapterOptionsSchema };
