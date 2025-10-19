/**
 * @fileoverview Test setup for URL adapter
 */

import { vi } from "vitest";

// Mock console methods for testing
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// Setup global mocks
(global as any).beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

(global as any).afterEach(() => {
  // Restore console after each test
  Object.assign(console, originalConsole);
});

// Global test utilities
(global as any).testUtils = {
  mockConsole: () => {
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
  },
};
