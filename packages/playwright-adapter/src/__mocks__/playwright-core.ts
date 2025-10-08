/**
 * Mock implementation of playwright-core for testing
 */

import { vi, beforeEach } from "vitest";

export const chromium = {
  launch: vi.fn(),
} as any;

export const firefox = {
  launch: vi.fn(),
} as any;

export const webkit = {
  launch: vi.fn(),
} as any;

// Mock browser instance
export const mockBrowser = {
  newPage: vi.fn(),
  newContext: vi.fn(),
  close: vi.fn(),
} as any;

// Mock page instance
export const mockPage = {
  setDefaultTimeout: vi.fn(),
  setViewportSize: vi.fn(),
  goto: vi.fn(),
  waitForLoadState: vi.fn(),
  waitForTimeout: vi.fn(),
  waitForSelector: vi.fn(),
  close: vi.fn(),
} as any;

// Mock context instance
export const mockContext = {
  newPage: vi.fn(),
  close: vi.fn(),
} as any;

// Mock element instance
export const mockElement = {
  screenshot: vi.fn(),
} as any;

// Setup default mock implementations
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Setup default mock implementations
  chromium.launch.mockResolvedValue(mockBrowser);
  firefox.launch.mockResolvedValue(mockBrowser);
  webkit.launch.mockResolvedValue(mockBrowser);

  mockBrowser.newPage.mockResolvedValue(mockPage);
  mockBrowser.newContext.mockResolvedValue(mockContext);
  mockBrowser.close.mockResolvedValue(undefined);

  mockContext.newPage.mockResolvedValue(mockPage);
  mockContext.close.mockResolvedValue(undefined);

  mockPage.setDefaultTimeout.mockResolvedValue(undefined);
  mockPage.setViewportSize.mockResolvedValue(undefined);
  mockPage.goto.mockResolvedValue(undefined);
  mockPage.waitForLoadState.mockResolvedValue(undefined);
  mockPage.waitForTimeout.mockResolvedValue(undefined);
  mockPage.waitForSelector.mockResolvedValue(mockElement);
  mockPage.close.mockResolvedValue(undefined);

  mockElement.screenshot.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
});
