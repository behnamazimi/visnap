/**
 * @fileoverview Mock factory functions for URL adapter testing
 */

import type {
  TestCaseInstanceMeta,
  ViewportMap,
  FilterOptions,
  Viewport,
  InteractionAction,
} from "@visnap/protocol";

import type { UrlConfig, CreateUrlAdapterOptions } from "../validation";

/**
 * Creates a mock viewport configuration
 */
export function createMockViewport(
  overrides: Partial<Viewport> = {}
): Viewport {
  return {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    ...overrides,
  };
}

/**
 * Creates a mock URL configuration
 */
export function createMockUrlConfig(
  overrides: Partial<UrlConfig> = {}
): UrlConfig {
  return {
    id: "test-url",
    url: "http://localhost:3000/test",
    ...overrides,
  };
}

/**
 * Creates a mock filter options object
 */
export function createMockFilterOptions(
  overrides: Partial<FilterOptions> = {}
): FilterOptions {
  return {
    include: undefined,
    exclude: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock test case instance
 */
export function createMockTestCaseInstance(
  overrides: Partial<TestCaseInstanceMeta> = {}
): TestCaseInstanceMeta {
  return {
    id: "test-case-1",
    caseId: "test-case-1",
    variantId: "default",
    title: "Test Case",
    kind: "url",
    url: "http://localhost:3000/test",
    screenshotTarget: "body",
    viewport: createMockViewport(),
    threshold: 0.1,
    disableCSSInjection: false,
    interactions: [],
    elementsToMask: [],
    parameters: {},
    tags: [],
    visualTesting: {
      skip: false,
      screenshotTarget: "body",
      threshold: 0.1,
      viewport: createMockViewport(),
      disableCSSInjection: false,
      interactions: [],
      elementsToMask: [],
    },
    ...overrides,
  };
}

/**
 * Creates a mock viewport map
 */
export function createMockViewportMap(
  overrides: Partial<ViewportMap> = {}
): ViewportMap {
  return {
    desktop: createMockViewport({ width: 1920, height: 1080 }),
    mobile: createMockViewport({ width: 375, height: 667 }),
    tablet: createMockViewport({ width: 768, height: 1024 }),
    ...overrides,
  };
}

/**
 * Creates a mock create URL adapter options
 */
export function createMockCreateUrlAdapterOptions(
  overrides: Partial<CreateUrlAdapterOptions> = {}
): CreateUrlAdapterOptions {
  return {
    urls: [createMockUrlConfig()],
    include: undefined,
    exclude: undefined,
    ...overrides,
  };
}

/**
 * Creates multiple mock URL configurations
 */
export function createMockUrlConfigs(
  count: number,
  baseOverrides: Partial<UrlConfig> = {}
): UrlConfig[] {
  return Array.from({ length: count }, (_, index) =>
    createMockUrlConfig({
      id: `test-url-${index + 1}`,
      url: `http://localhost:3000/test-${index + 1}`,
      ...baseOverrides,
    })
  );
}

/**
 * Creates a mock URL config with specific viewport
 */
export function createMockUrlConfigWithViewport(
  viewport: Viewport,
  overrides: Partial<UrlConfig> = {}
): UrlConfig {
  return createMockUrlConfig({
    viewport,
    ...overrides,
  });
}

/**
 * Creates a mock URL config with interactions
 */
export function createMockUrlConfigWithInteractions(
  interactions: InteractionAction[],
  overrides: Partial<UrlConfig> = {}
): UrlConfig {
  return createMockUrlConfig({
    interactions,
    ...overrides,
  });
}

/**
 * Creates a mock URL config with elements to mask
 */
export function createMockUrlConfigWithMasking(
  elementsToMask: string[],
  overrides: Partial<UrlConfig> = {}
): UrlConfig {
  return createMockUrlConfig({
    elementsToMask,
    ...overrides,
  });
}
