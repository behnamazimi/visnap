/**
 * Test setup file for playwright-adapter
 */

import { beforeEach, afterEach, vi } from "vitest";

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  // Reset console mocks before each test
  console.warn = vi.fn();
  console.error = vi.fn();
});

afterEach(() => {
  // Restore original console methods after each test
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
