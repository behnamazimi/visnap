import { type } from "arktype";

// ============= Schema Definitions =============

const browserNameSchema = type("'chromium'|'firefox'|'webkit'|string");

const launchOptionsSchema = type({
  browser: browserNameSchema,
  headless: "boolean?",
  channel: "string?",
});

const contextOptionsSchema = type({
  colorScheme: "'light'|'dark'?",
  reducedMotion: "'reduce'|'no-preference'?",
  storageStatePath: "string?",
});

const navigationOptionsSchema = type({
  baseUrl: "string?",
  waitUntil: "'load'|'domcontentloaded'|'networkidle'?",
  timeoutMs: "number>0?",
});

const performanceOptionsSchema = type({
  blockResources: "string[]?",
  reuseContext: "boolean?",
  disableAnimations: "boolean?",
});

const playwrightAdapterOptionsSchema = type({
  "launch?": launchOptionsSchema,
  "context?": contextOptionsSchema,
  "navigation?": navigationOptionsSchema,
  "injectCSS?": "string",
  "performance?": performanceOptionsSchema,
});

// ============= Type Exports (inferred from schemas) =============

export type BrowserName = typeof browserNameSchema.infer;
export type LaunchOptions = typeof launchOptionsSchema.infer;
export type ContextOptions = typeof contextOptionsSchema.infer;
export type NavigationOptions = typeof navigationOptionsSchema.infer;
export type PerformanceOptions = typeof performanceOptionsSchema.infer;
export type PlaywrightAdapterOptions =
  typeof playwrightAdapterOptionsSchema.infer;

// ============= Validation Functions =============

/**
 * Validates launch options
 */
export function validateLaunchOptions(launch: unknown): LaunchOptions {
  const result = launchOptionsSchema(launch);
  if (result instanceof type.errors) {
    throw new Error(`Invalid launch options: ${result.summary}`);
  }
  return result;
}

/**
 * Validates context options
 */
export function validateContextOptions(context: unknown): ContextOptions {
  const result = contextOptionsSchema(context);
  if (result instanceof type.errors) {
    throw new Error(`Invalid context options: ${result.summary}`);
  }
  return result;
}

/**
 * Validates navigation options
 */
export function validateNavigationOptions(
  navigation: unknown
): NavigationOptions {
  const result = navigationOptionsSchema(navigation);
  if (result instanceof type.errors) {
    throw new Error(`Invalid navigation options: ${result.summary}`);
  }
  return result;
}

/**
 * Validates performance options
 */
export function validatePerformanceOptions(
  performance: unknown
): PerformanceOptions {
  const result = performanceOptionsSchema(performance);
  if (result instanceof type.errors) {
    throw new Error(`Invalid performance options: ${result.summary}`);
  }
  return result;
}

/**
 * Validates playwright adapter options
 */
export function validateOptions(opts: unknown): PlaywrightAdapterOptions {
  const result = playwrightAdapterOptionsSchema(opts);
  if (result instanceof type.errors) {
    throw new Error(`Invalid playwright adapter options: ${result.summary}`);
  }
  return result;
}

// ============= Schema Exports =============

export {
  browserNameSchema,
  launchOptionsSchema,
  contextOptionsSchema,
  navigationOptionsSchema,
  performanceOptionsSchema,
  playwrightAdapterOptionsSchema,
};
