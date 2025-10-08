import { beforeEach, afterEach, vi } from "vitest";

/**
 * Test setup file for core package
 */

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  // Reset console mocks before each test
  console.warn = vi.fn();
  console.error = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  // Restore original console methods after each test
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});
