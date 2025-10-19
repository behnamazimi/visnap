/**
 * @fileoverview Test helper functions for CLI testing
 */

import { vi } from "vitest";

/**
 * Mocks console output methods (log, warn, error, info)
 */
export function mockConsoleOutput() {
  const mockLog = vi.fn();
  const mockWarn = vi.fn();
  const mockError = vi.fn();
  const mockInfo = vi.fn();

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  Object.assign(console, {
    log: mockLog,
    warn: mockWarn,
    error: mockError,
    info: mockInfo,
  });

  return {
    log: mockLog,
    warn: mockWarn,
    error: mockError,
    info: mockInfo,
    restore: () => Object.assign(console, originalConsole),
  };
}

/**
 * Mocks process.exit to prevent actual exit during tests
 */
export function mockProcessExit() {
  const mockExit = vi.fn().mockImplementation((code?: number) => {
    throw new Error(`process.exit unexpectedly called with "${code}"`);
  });

  // Temporarily replace process.exit
  const originalExit = process.exit;
  (process as any).exit = mockExit;

  return Object.assign(mockExit, {
    restore: () => {
      (process as any).exit = originalExit;
    },
  });
}

/**
 * Creates a mock file system
 */
export function createMockFileSystem() {
  const files = new Map<string, string | Buffer>();
  const directories = new Set<string>();

  const mockFs = {
    existsSync: vi.fn((path: string) => {
      return files.has(path) || directories.has(path);
    }),
    readFileSync: vi.fn((path: string) => {
      return files.get(path) || Buffer.from("");
    }),
    writeFileSync: vi.fn((path: string, content: string | Buffer) => {
      files.set(path, content);
    }),
    mkdirSync: vi.fn((path: string) => {
      directories.add(path);
    }),
    files,
    directories,
  };

  return mockFs;
}
