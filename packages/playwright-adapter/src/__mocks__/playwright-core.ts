/**
 * Mock implementation of playwright-core for testing
 */

import { vi, beforeEach } from "vitest";

import { defaultMocks, setupDefaultMocks } from "./mock-playwright";

// Export browser types for compatibility
export const chromium = defaultMocks.browserType;
export const firefox = defaultMocks.browserType;
export const webkit = defaultMocks.browserType;

// Export mock instances for compatibility
export const mockBrowser = defaultMocks.browser;
export const mockPage = defaultMocks.page;
export const mockContext = defaultMocks.context;
export const mockElement = defaultMocks.element;
export const mockLocator = defaultMocks.locator;

// Setup default mock implementations
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Setup default mock implementations using the centralized setup
  setupDefaultMocks();
});
