import { type } from "arktype";

import { ConfigError } from "@/utils/error-handler";

// ============= Basic Type Schemas =============

const viewportSchema = type({
  width: "number>0",
  height: "number>0",
  "deviceScaleFactor?": "number>0",
});

const viewportMapSchema = type("object");

const comparisonCoreSchema = type("'odiff'|'pixelmatch'|string");

const comparisonConfigSchema = type({
  core: comparisonCoreSchema,
  threshold: "number>=0&number<=1",
  diffColor: "string?",
});

const browserNameSchema = type("'chromium'|'firefox'|'webkit'|string");

const browserConfigurationSchema = type("string|object");

const browserAdapterOptionsSchema = type({
  name: "string",
  options: "object?",
});

const testCaseAdapterOptionsSchema = type({
  name: "string",
  options: "object?",
});

const runtimeConfigSchema = type({
  "maxConcurrency?": "number>0|object",
  "quiet?": "boolean",
});

const reporterConfigSchema = type({
  "html?": "boolean|string",
  "json?": "boolean|string",
});

// ============= Main Config Schema =============

const visualTestingToolConfigSchema = type({
  adapters: {
    browser: browserAdapterOptionsSchema,
    testCase: "object[]",
  },
  "comparison?": comparisonConfigSchema,
  "screenshotDir?": "string",
  "runtime?": runtimeConfigSchema,
  "viewport?": viewportMapSchema,
  "reporter?": reporterConfigSchema,
});

// ============= Type Exports (inferred from schemas) =============

export type Viewport = typeof viewportSchema.infer;
export type ViewportMap = typeof viewportMapSchema.infer;
export type ComparisonCore = typeof comparisonCoreSchema.infer;
export type ComparisonConfig = typeof comparisonConfigSchema.infer;
export type BrowserName = typeof browserNameSchema.infer;
export type BrowserConfiguration = typeof browserConfigurationSchema.infer;
export type BrowserAdapterOptions = typeof browserAdapterOptionsSchema.infer;
export type TestCaseAdapterOptions = typeof testCaseAdapterOptionsSchema.infer;
export type RuntimeConfig = typeof runtimeConfigSchema.infer;
export type ReporterConfig = typeof reporterConfigSchema.infer;
export type VisualTestingToolConfig =
  typeof visualTestingToolConfigSchema.infer;

// ============= Validation Functions =============

/**
 * Validates a viewport object
 */
export function validateViewport(viewport: unknown): Viewport {
  const result = viewportSchema(viewport);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid viewport: ${result.summary}`);
  }
  return result;
}

/**
 * Validates a viewport map
 */
export function validateViewportMap(viewportMap: unknown): ViewportMap {
  const result = viewportMapSchema(viewportMap);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid viewport map: ${result.summary}`);
  }
  return result;
}

/**
 * Validates a comparison config
 */
export function validateComparisonConfig(
  comparison: unknown
): ComparisonConfig {
  const result = comparisonConfigSchema(comparison);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid comparison config: ${result.summary}`);
  }
  return result;
}

/**
 * Validates a browser adapter options
 */
export function validateBrowserAdapterOptions(
  options: unknown
): BrowserAdapterOptions {
  const result = browserAdapterOptionsSchema(options);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid browser adapter options: ${result.summary}`);
  }
  return result;
}

/**
 * Validates test case adapter options array
 */
export function validateTestCaseAdapterOptions(
  options: unknown
): TestCaseAdapterOptions[] {
  // Basic array validation
  if (!Array.isArray(options)) {
    throw new ConfigError("Test case adapter options must be an array");
  }

  // Validate each item in the array
  for (let i = 0; i < options.length; i++) {
    const item = options[i];
    const result = testCaseAdapterOptionsSchema(item);
    if (result instanceof type.errors) {
      throw new ConfigError(
        `Invalid test case adapter options at index ${i}: ${result.summary}`
      );
    }
  }

  return options as TestCaseAdapterOptions[];
}

/**
 * Validates runtime config
 */
export function validateRuntimeConfig(runtime: unknown): RuntimeConfig {
  const result = runtimeConfigSchema(runtime);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid runtime config: ${result.summary}`);
  }
  return result;
}

/**
 * Validates reporter config
 */
export function validateReporterConfig(reporter: unknown): ReporterConfig {
  const result = reporterConfigSchema(reporter);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid reporter config: ${result.summary}`);
  }
  return result;
}

/**
 * Validates the complete visual testing tool configuration
 */
export function validateConfig(config: unknown): VisualTestingToolConfig {
  const result = visualTestingToolConfigSchema(config);
  if (result instanceof type.errors) {
    throw new ConfigError(`Invalid configuration: ${result.summary}`);
  }
  return result as VisualTestingToolConfig;
}

// ============= Schema Exports =============

export {
  viewportSchema,
  viewportMapSchema,
  comparisonCoreSchema,
  comparisonConfigSchema,
  browserNameSchema,
  browserConfigurationSchema,
  browserAdapterOptionsSchema,
  testCaseAdapterOptionsSchema,
  runtimeConfigSchema,
  reporterConfigSchema,
  visualTestingToolConfigSchema,
};
