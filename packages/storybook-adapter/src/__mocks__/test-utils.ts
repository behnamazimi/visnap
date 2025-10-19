/**
 * @fileoverview Test utility functions for storybook-adapter tests
 */

import type { PageWithEvaluate, ViewportMap } from "@visnap/protocol";
import { vi } from "vitest";

/**
 * Creates a mock page context with evaluate capability
 */
export function createMockPageContext(
  overrides: Partial<PageWithEvaluate> = {}
): PageWithEvaluate {
  return {
    evaluate: vi.fn(),
    close: vi.fn(),
    ...overrides,
  } as PageWithEvaluate;
}

/**
 * Creates a mock server manager
 */
export function createMockServerManager(
  overrides: {
    baseUrl?: string;
    ensureStarted?: () => Promise<void>;
    stop?: () => Promise<void>;
  } = {}
) {
  return {
    ensureStarted: vi.fn().mockResolvedValue(undefined),
    getBaseUrl: vi
      .fn()
      .mockReturnValue(overrides.baseUrl || "http://localhost:4477"),
    stop: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Creates a mock HTTP server
 */
export function createMockServer(
  overrides: {
    listen?: (port: number, callback: () => void) => void;
    close?: (callback: () => void) => void;
    once?: (event: string, handler: (error: Error) => void) => void;
    off?: (event: string, handler: (error: Error) => void) => void;
  } = {}
) {
  return {
    listen: vi
      .fn()
      .mockImplementation((_port: number, callback: () => void) => {
        // Default implementation calls callback immediately
        setTimeout(callback, 0);
      }),
    close: vi.fn().mockImplementation((callback: () => void) => {
      callback();
    }),
    once: vi.fn(),
    off: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock Storybook window object
 */
export function createMockStorybook(
  overrides: {
    ready?: () => Promise<void>;
    extract?: () => Promise<Record<string, unknown>>;
  } = {}
) {
  return {
    ready: vi.fn().mockResolvedValue(undefined),
    extract: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

/**
 * Sets up the global window object with Storybook preview
 */
export function setupStorybookWindow(storybook: any) {
  // Store original window
  const originalWindow = global.window;

  // Mock window with Storybook
  global.window = {
    __STORYBOOK_PREVIEW__: storybook,
  } as any;

  // Return cleanup function
  return () => {
    global.window = originalWindow;
  };
}

/**
 * Creates a mock viewport configuration
 */
export function createMockViewport(
  overrides: Partial<ViewportMap> = {}
): ViewportMap {
  return {
    default: { width: 1024, height: 768 },
    mobile: { width: 375, height: 667 },
    ...overrides,
  };
}

/**
 * Helper to wait for server startup with timeout
 */
export function waitForServerStart(
  server: any,
  timeoutMs: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server start timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    server.listen.mockImplementation((_port: number, callback: () => void) => {
      clearTimeout(timeout);
      callback();
      resolve();
    });
  });
}

/**
 * Creates a mock setTimeout that can be controlled
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

  const clearTimeout = vi.fn((_id: number) => {
    // timers.delete(id); // Not needed for mock
  });

  const advanceTime = (_ms: number) => {
    currentTime += _ms;
    const toExecute: (() => void)[] = [];

    for (const [_id, callback] of timers) {
      toExecute.push(callback);
      timers.delete(_id);
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

/**
 * Creates a mock console for testing
 */
export function createMockConsole() {
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
 * Helper to create a promise that resolves after a delay
 */
export function createDelayedPromise<T>(
  value: T,
  _delayMs: number = 100
): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), _delayMs);
  });
}

/**
 * Helper to create a promise that rejects after a delay
 */
export function createDelayedRejection(
  error: Error,
  delayMs: number = 100
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), delayMs);
  });
}
