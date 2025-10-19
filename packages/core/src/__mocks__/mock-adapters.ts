/**
 * @fileoverview Mock adapter implementations for testing
 */

import type {
  BrowserAdapter,
  TestCaseAdapter,
  StorageAdapter,
  BrowserName,
  PageWithEvaluate,
} from "@visnap/protocol";
import { SNAPSHOT_EXTENSION } from "@visnap/protocol";
import { vi } from "vitest";

import {
  createMockScreenshotResult,
  createMockTestCase,
} from "./mock-factories";

/**
 * Creates a mock browser adapter
 */
export function createMockBrowserAdapter(
  overrides: Partial<BrowserAdapter> = {}
): BrowserAdapter {
  return {
    name: "mock-browser",
    init: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
    capture: vi.fn().mockResolvedValue(createMockScreenshotResult()),
    openPage: vi.fn().mockResolvedValue({
      close: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as PageWithEvaluate),
    ...overrides,
  };
}

/**
 * Creates a mock test case adapter
 */
export function createMockTestCaseAdapter(
  overrides: Partial<TestCaseAdapter> = {}
): TestCaseAdapter {
  return {
    name: "mock-testcase",
    start: vi.fn().mockResolvedValue({
      baseUrl: "http://localhost:6006",
      initialPageUrl: "http://localhost:6006/iframe.html",
    }),
    stop: vi.fn().mockResolvedValue(undefined),
    listCases: vi
      .fn()
      .mockResolvedValue([
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ]),
    ...overrides,
  };
}

/**
 * Creates a mock storage adapter
 */
export function createMockStorageAdapter(
  overrides: Partial<StorageAdapter> = {}
): StorageAdapter {
  return {
    list: vi
      .fn()
      .mockResolvedValue([
        `file1${SNAPSHOT_EXTENSION}`,
        `file2${SNAPSHOT_EXTENSION}`,
      ]),
    getReadablePath: vi.fn().mockImplementation((kind, filename) => {
      if (kind === "current") return `/current/${filename}`;
      if (kind === "base") return `/base/${filename}`;
      if (kind === "diff") return `/diff/${filename}`;
      return `/${kind}/${filename}`;
    }),
    write: vi.fn().mockResolvedValue(""),
    exists: vi.fn().mockResolvedValue(true),
    read: vi.fn().mockResolvedValue(new Uint8Array()),
    cleanup: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Creates a mock page with evaluate method
 */
export function createMockPage(
  overrides: Partial<PageWithEvaluate> = {}
): PageWithEvaluate {
  return {
    close: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as PageWithEvaluate;
}

/**
 * Creates a mock browser adapter pool
 */
export function createMockBrowserAdapterPool() {
  const adapters = new Map<BrowserName, BrowserAdapter>();

  return {
    getAdapter: vi.fn().mockImplementation(async (browserName: BrowserName) => {
      if (!adapters.has(browserName)) {
        adapters.set(browserName, createMockBrowserAdapter());
      }
      return adapters.get(browserName)!;
    }),
    disposeAll: vi.fn().mockResolvedValue(undefined),
    adapters,
  };
}
