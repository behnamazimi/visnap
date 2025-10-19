/**
 * @fileoverview Test helper functions for common testing patterns
 */

import type {
  Browser,
  BrowserContext,
  Page,
  ElementHandle,
} from "playwright-core";
import { vi, expect } from "vitest";

import {
  createMockBrowser,
  createMockBrowserContext,
  createMockPage,
  createMockElement,
} from "./mock-playwright";

/**
 * Creates a mock page with specific behaviors
 */
export function createMockPlaywrightPage(overrides: Partial<Page> = {}): Page {
  const mockPage = createMockPage();
  return Object.assign(mockPage, overrides);
}

/**
 * Creates a mock browser context with specific behaviors
 */
export function createMockBrowserContextWithOverrides(
  overrides: Partial<BrowserContext> = {}
): BrowserContext {
  const mockContext = createMockBrowserContext();
  return Object.assign(mockContext, overrides);
}

/**
 * Creates a mock browser with specific behaviors
 */
export function createMockBrowserWithOverrides(
  overrides: Partial<Browser> = {}
): Browser {
  const mockBrowser = createMockBrowser();
  return Object.assign(mockBrowser, overrides);
}

/**
 * Creates a mock element with specific behaviors
 */
export function createMockElementWithOverrides(
  overrides: Partial<ElementHandle> = {}
): ElementHandle {
  const mockElement = createMockElement();
  return Object.assign(mockElement, overrides);
}

/**
 * Sets up a complete mock browser environment
 */
export function setupMockBrowser() {
  const browser = createMockBrowser();
  const context = createMockBrowserContext();
  const page = createMockPage();
  const element = createMockElement();

  // Setup default mock implementations
  (browser.newPage as any).mockResolvedValue(page);
  (browser.newContext as any).mockResolvedValue(context);
  (browser.close as any).mockResolvedValue(undefined);

  (context.newPage as any).mockResolvedValue(page);
  (context.close as any).mockResolvedValue(undefined);
  (context.clearCookies as any).mockResolvedValue(undefined);
  (context.route as any).mockImplementation(() => {});
  (context.unroute as any).mockImplementation(() => {});

  (page.setDefaultTimeout as any).mockResolvedValue(undefined);
  (page.setViewportSize as any).mockResolvedValue(undefined);
  (page.goto as any).mockResolvedValue(undefined);
  (page.waitForLoadState as any).mockResolvedValue(undefined);
  (page.waitForTimeout as any).mockResolvedValue(undefined);
  (page.waitForSelector as any).mockResolvedValue(element);
  (page.addStyleTag as any).mockResolvedValue(undefined);
  (page.close as any).mockResolvedValue(undefined);
  (page.emulateMedia as any).mockResolvedValue(undefined);
  (page.evaluate as any).mockResolvedValue(undefined);

  (element.screenshot as any).mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
  (element.scrollIntoViewIfNeeded as any).mockResolvedValue(undefined);

  return { browser, context, page, element };
}

/**
 * Creates a mock console with all methods
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
 * Creates a mock performance.now() function
 */
export function mockPerformanceNow(initialTime: number = 0) {
  let currentTime = initialTime;

  const mockNow = vi.fn(() => currentTime);

  Object.defineProperty(global, "performance", {
    value: {
      now: mockNow,
    },
    writable: true,
  });

  return {
    mockNow,
    advance: (ms: number) => {
      currentTime += ms;
    },
    set: (time: number) => {
      currentTime = time;
    },
    restore: () => {
      delete (global as any).performance;
    },
  };
}

/**
 * Assertion helpers for mock verification
 */
export const expectMockCalled = {
  /**
   * Expects a mock function to have been called with specific arguments
   */
  withArgs: (mockFn: any, ...args: any[]) => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },

  /**
   * Expects a mock function to have been called a specific number of times
   */
  times: (mockFn: any, times: number) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  },

  /**
   * Expects a mock function to have been called at least once
   */
  atLeastOnce: (mockFn: any) => {
    expect(mockFn).toHaveBeenCalled();
  },

  /**
   * Expects a mock function to never have been called
   */
  never: (mockFn: any) => {
    expect(mockFn).not.toHaveBeenCalled();
  },

  /**
   * Expects a mock function to have been called with any arguments
   */
  withAnyArgs: (mockFn: any) => {
    expect(mockFn).toHaveBeenCalledWith(expect.anything());
  },
};

/**
 * Creates a mock file system with in-memory storage
 */
export function createMockFileSystem() {
  const files = new Map<string, string | Buffer>();
  const directories = new Set<string>();

  return {
    files,
    directories,
    writeFile: vi.fn((path: string, content: string | Buffer) => {
      files.set(path, content);
    }),
    readFile: vi.fn((path: string) => {
      return files.get(path) || Buffer.from("");
    }),
    exists: vi.fn((path: string) => {
      return files.has(path) || directories.has(path);
    }),
    mkdir: vi.fn((path: string) => {
      directories.add(path);
    }),
    list: vi.fn((path: string) => {
      return Array.from(files.keys()).filter(key => key.startsWith(path));
    }),
  };
}

/**
 * Creates a mock timer with controllable time
 */
export function createMockTimer() {
  let currentTime = 0;
  const timers = new Map<number, () => void>();
  let nextId = 1;

  const setTimeout = vi.fn((callback: () => void, _delay: number) => {
    const id = nextId++;
    timers.set(id, callback);
    return id;
  });

  const clearTimeout = vi.fn((id: number) => {
    timers.delete(id);
  });

  const advanceTime = (ms: number) => {
    currentTime += ms;
    const toExecute: (() => void)[] = [];

    for (const [id, callback] of timers) {
      toExecute.push(callback);
      timers.delete(id);
    }

    toExecute.forEach(callback => callback());
  };

  return {
    setTimeout,
    clearTimeout,
    advanceTime,
    getCurrentTime: () => currentTime,
  };
}
