/**
 * @fileoverview Test helper functions for common testing patterns
 */

import { vi } from "vitest";

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
 * Creates a mock AbortController
 */
export function createMockAbortController() {
  let aborted = false;
  const listeners = new Set<() => void>();

  return {
    signal: {
      aborted,
      addEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "abort") {
          listeners.add(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: () => void) => {
        if (event === "abort") {
          listeners.delete(listener);
        }
      }),
    },
    abort: vi.fn(() => {
      aborted = true;
      listeners.forEach(listener => listener());
    }),
  };
}

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
