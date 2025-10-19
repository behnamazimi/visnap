/**
 * @fileoverview Test helper functions for fs-adapter testing
 */

import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { expect } from "vitest";

import {
  FsStorageAdapter,
  type FsStorageAdapterOptions,
} from "../fs-storage-adapter";

/**
 * Creates a test buffer with PNG-like data
 * @param size - Size of the buffer in bytes (default: 4)
 * @returns Uint8Array with test data
 */
export function createTestBuffer(size: number = 4): Uint8Array {
  const buffer = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    buffer[i] = (i + 1) % 256;
  }
  return buffer;
}

/**
 * Creates a PNG-like test buffer with proper header
 * @returns Uint8Array with PNG header and test data
 */
export function createPngTestBuffer(): Uint8Array {
  // PNG header + minimal data
  const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG signature
  const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const buffer = new Uint8Array(pngHeader.length + testData.length);
  buffer.set(pngHeader, 0);
  buffer.set(testData, pngHeader.length);
  return buffer;
}

/**
 * Creates a temporary test directory
 * @returns Promise resolving to the temporary directory path
 */
export async function createTempTestDir(): Promise<string> {
  return await mkdtemp(join(tmpdir(), "visnap-fs-adapter-test-"));
}

/**
 * Cleans up a temporary test directory
 * @param dir - Directory path to clean up
 */
export async function cleanupTempTestDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

/**
 * Creates a mock FsStorageAdapter with optional overrides
 * @param options - Adapter options
 * @param overrides - Optional method overrides for mocking
 * @returns Mock adapter instance
 */
export function createMockFsAdapter(
  options: FsStorageAdapterOptions,
  overrides: Partial<FsStorageAdapter> = {}
): FsStorageAdapter {
  const adapter = new FsStorageAdapter(options);
  return Object.assign(adapter, overrides);
}

/**
 * Creates a test adapter with temporary directory
 * @param options - Optional adapter options (screenshotDir will be overridden)
 * @returns Object with adapter and cleanup function
 */
export async function createTestAdapter(
  options: Partial<FsStorageAdapterOptions> = {}
): Promise<{
  adapter: FsStorageAdapter;
  tempDir: string;
  cleanup: () => Promise<void>;
}> {
  const tempDir = await createTempTestDir();
  const adapter = new FsStorageAdapter({
    screenshotDir: tempDir,
    ...options,
  });

  return {
    adapter,
    tempDir,
    cleanup: () => cleanupTempTestDir(tempDir),
  };
}

/**
 * Asserts that a path is within the expected base directory
 * @param path - Path to check
 * @param baseDir - Base directory that the path should be within
 */
export function expectPathInDirectory(path: string, baseDir: string): void {
  expect(path).toMatch(
    new RegExp(`^${baseDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
  );
}

/**
 * Asserts that a path contains the expected directory name
 * @param path - Path to check
 * @param dirName - Directory name that should be in the path
 */
export function expectPathContainsDir(path: string, dirName: string): void {
  expect(path).toContain(dirName);
}

/**
 * Asserts that a function throws a StorageError with the expected message
 * @param fn - Function to execute
 * @param expectedMessage - Expected error message (optional)
 */
export async function expectStorageError(
  fn: () => Promise<unknown>,
  expectedMessage?: string
): Promise<void> {
  if (expectedMessage) {
    await expect(fn).rejects.toThrow(expectedMessage);
  } else {
    await expect(fn).rejects.toThrow("StorageError");
  }
}

/**
 * Asserts that a function throws an error with the expected message
 * @param fn - Function to execute
 * @param expectedMessage - Expected error message
 */
export async function expectErrorWithMessage(
  fn: () => Promise<unknown>,
  expectedMessage: string
): Promise<void> {
  await expect(fn).rejects.toThrow(expectedMessage);
}

/**
 * Creates a test filename with various special characters for sanitization testing
 * @param baseName - Base filename
 * @returns Filename with special characters
 */
export function createTestFilenameWithSpecialChars(
  baseName: string = "test"
): string {
  return `${baseName}@#$%^&*()[]{}|\\:";'<>?,./.png`;
}

/**
 * Creates a very long filename for edge case testing
 * @param baseName - Base filename
 * @param length - Target length (default: 300)
 * @returns Long filename
 */
export function createLongTestFilename(
  baseName: string = "test",
  length: number = 300
): string {
  const extension = ".png";
  const availableLength = length - extension.length;
  const baseLength = baseName.length;
  const repeatCount = Math.floor((availableLength - baseLength) / baseLength);
  const remainder = (availableLength - baseLength) % baseLength;

  let longName = baseName;
  for (let i = 0; i < repeatCount; i++) {
    longName += baseName;
  }
  longName += baseName.substring(0, remainder);

  return longName + extension;
}

/**
 * Creates a filename with Unicode characters for testing
 * @param baseName - Base filename
 * @returns Filename with Unicode characters
 */
export function createUnicodeTestFilename(baseName: string = "test"): string {
  return `${baseName}测试🚀🎉.png`;
}

/**
 * Creates a path traversal attack filename
 * @param attackType - Type of path traversal attack
 * @returns Malicious filename
 */
export function createPathTraversalFilename(
  attackType: "unix" | "windows" | "mixed" | "encoded"
): string {
  switch (attackType) {
    case "unix":
      return "../../../etc/passwd";
    case "windows":
      return "..\\..\\..\\windows\\system32\\drivers\\etc\\hosts";
    case "mixed":
      return "test/../../../etc/passwd";
    case "encoded":
      return "..%2F..%2F..%2Fetc%2Fpasswd";
    default:
      return "../../../etc/passwd";
  }
}

/**
 * Waits for a condition to be true with timeout
 * @param condition - Function that returns boolean
 * @param timeoutMs - Timeout in milliseconds (default: 1000)
 * @param intervalMs - Check interval in milliseconds (default: 10)
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
