/**
 * @fileoverview Test helper functions for URL adapter testing
 */

import { vi } from "vitest";

import type { UrlConfig, CreateUrlAdapterOptions } from "../validation";

import {
  createMockUrlConfig,
  createMockCreateUrlAdapterOptions,
} from "./url-mock-factories";

/**
 * Creates a test URL configuration with sensible defaults
 */
export function createTestUrlConfig(
  overrides: Partial<UrlConfig> = {}
): UrlConfig {
  return createMockUrlConfig(overrides);
}

/**
 * Creates test URL configurations for common scenarios
 */
export function createTestUrlConfigs(): UrlConfig[] {
  return [
    createTestUrlConfig({
      id: "homepage",
      url: "http://localhost:3000/",
      title: "homepage",
    }),
    createTestUrlConfig({
      id: "about-page",
      url: "http://localhost:3000/about",
      title: "about-page",
    }),
    createTestUrlConfig({
      id: "contact-form",
      url: "http://localhost:3000/contact",
      title: "contact-form",
    }),
    createTestUrlConfig({
      id: "admin-dashboard",
      url: "http://localhost:3000/admin",
      title: "admin-dashboard",
    }),
    createTestUrlConfig({
      id: "pricing-page",
      url: "http://localhost:3000/pricing",
      title: "pricing-page",
    }),
  ];
}

/**
 * Creates test adapter options with common scenarios
 */
export function createTestAdapterOptions(
  overrides: Partial<CreateUrlAdapterOptions> = {}
): CreateUrlAdapterOptions {
  return createMockCreateUrlAdapterOptions({
    urls: createTestUrlConfigs(),
    ...overrides,
  });
}

/**
 * Creates a mock console with all methods for testing console output
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  const mockConsole = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  };

  Object.assign(console, mockConsole);

  return {
    mockConsole,
    restore: () => Object.assign(console, originalConsole),
  };
}

/**
 * Creates a test timeout helper
 */
export function createTestTimeout(timeoutMs: number = 1000) {
  return new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Test timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    // Return cleanup function
    return () => clearTimeout(timeoutId);
  });
}

/**
 * Waits for a condition to be true with timeout
 */
export async function waitForCondition(
  condition: () => boolean,
  timeoutMs: number = 1000,
  intervalMs: number = 10
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Condition not met within ${timeoutMs}ms`);
}

/**
 * Creates a mock viewport with validation errors for testing
 */
export function createInvalidViewport(
  type:
    | "null"
    | "non-object"
    | "missing-width"
    | "missing-height"
    | "non-numeric-width"
    | "non-numeric-height"
    | "negative-width"
    | "negative-height"
    | "zero-width"
    | "zero-height"
) {
  switch (type) {
    case "null":
      return null;
    case "non-object":
      return "not-an-object";
    case "missing-width":
      return { height: 1080 };
    case "missing-height":
      return { width: 1920 };
    case "non-numeric-width":
      return { width: "not-a-number", height: 1080 };
    case "non-numeric-height":
      return { width: 1920, height: "not-a-number" };
    case "negative-width":
      return { width: -100, height: 1080 };
    case "negative-height":
      return { width: 1920, height: -100 };
    case "zero-width":
      return { width: 0, height: 1080 };
    case "zero-height":
      return { width: 1920, height: 0 };
    default:
      return {};
  }
}

/**
 * Creates test patterns for filtering tests
 */
export function createTestPatterns() {
  return {
    include: {
      single: "homepage",
      array: ["homepage", "about*"],
      wildcard: ["*page*"],
      multiple: ["homepage", "contact-*"],
    },
    exclude: {
      single: "admin*",
      array: ["*admin*", "*form*"],
      wildcard: ["*test*"],
      multiple: ["*admin*", "*form*"],
    },
  };
}

/**
 * Creates test URLs with various configurations for comprehensive testing
 */
export function createComprehensiveTestUrls(): UrlConfig[] {
  return [
    // Basic URL
    createTestUrlConfig({ id: "homepage", url: "http://localhost:3000/" }),

    // URL with custom title
    createTestUrlConfig({
      id: "about",
      url: "http://localhost:3000/about",
      title: "About Page",
    }),

    // URL with viewport override
    createTestUrlConfig({
      id: "mobile-page",
      url: "http://localhost:3000/mobile",
      viewport: { width: 375, height: 667 },
    }),

    // URL with interactions
    createTestUrlConfig({
      id: "interactive-page",
      url: "http://localhost:3000/interactive",
      interactions: [{ type: "click", selector: "button" }],
    }),

    // URL with masking
    createTestUrlConfig({
      id: "masked-page",
      url: "http://localhost:3000/masked",
      elementsToMask: [".sticky", "#ads"],
    }),

    // URL with all options
    createTestUrlConfig({
      id: "full-config",
      url: "http://localhost:3000/full",
      title: "Full Configuration",
      screenshotTarget: "main",
      threshold: 0.05,
      disableCSSInjection: true,
      interactions: [{ type: "hover", selector: ".menu" }],
      elementsToMask: [".header", ".footer"],
      viewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    }),
  ];
}

/**
 * Asserts that a function throws with a specific error message
 */
export function expectToThrowWithMessage(
  fn: () => void,
  expectedMessage: string | RegExp
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).expect(() => fn()).toThrow(expectedMessage);
}

/**
 * Asserts that an async function throws with a specific error message
 */
export async function expectAsyncToThrowWithMessage(
  fn: () => Promise<void>,
  expectedMessage: string | RegExp
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (global as any).expect(fn()).rejects.toThrow(expectedMessage);
}
