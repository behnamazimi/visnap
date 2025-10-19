import { beforeEach, afterEach, vi } from "vitest";

/**
 * Test setup file for storybook-adapter
 */

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;

beforeEach(() => {
  // Reset console mocks before each test
  console.warn = vi.fn();
  console.error = vi.fn();
  console.log = vi.fn();
  console.info = vi.fn();
});

afterEach(() => {
  // Restore original console methods after each test
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.info = originalConsoleInfo;
});

// Global test timeout configuration
beforeEach(() => {
  // Set a reasonable timeout for all tests
  vi.setConfig({
    testTimeout: 10000,
    hookTimeout: 10000,
  });
});

// Clean up any global state after each test
afterEach(() => {
  // Clear all timers
  vi.clearAllTimers();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset modules if needed
  vi.resetModules();
});
