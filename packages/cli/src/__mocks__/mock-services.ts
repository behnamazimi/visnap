/**
 * @fileoverview Mock service implementations for CLI testing
 */

import { vi } from "vitest";

import type {
  TestServiceResult,
  TestServiceOptions,
} from "../services/test-service";

/**
 * Creates a mock TestService
 */
export function createMockTestService(
  overrides: Partial<{
    executeTests: (options: TestServiceOptions) => Promise<TestServiceResult>;
  }> = {}
) {
  return {
    executeTests: vi.fn().mockResolvedValue({
      success: true,
      exitCode: 0,
      outcome: {
        total: 5,
        passed: 5,
        failedDiffs: 0,
        failedErrors: 0,
        captureFailures: 0,
      },
      config: {
        screenshotDir: "./visnap",
        reporter: {
          html: true,
          json: true,
        },
      },
    } as TestServiceResult),
    ...overrides,
  };
}

/**
 * Creates a mock PresentationService
 */
export function createMockPresentationService(
  overrides: Partial<{
    startLoading: (message: string) => void;
    updateLoading: (message: string) => void;
    completeLoading: (message: string) => void;
    failLoading: (message: string) => void;
    stopLoading: () => void;
    displayTestSummary: (result: any) => void;
    displaySuccess: (message: string) => void;
    displayError: (message: string) => void;
    displayInfo: (message: string) => void;
  }> = {}
) {
  return {
    startLoading: vi.fn(),
    updateLoading: vi.fn(),
    completeLoading: vi.fn(),
    failLoading: vi.fn(),
    stopLoading: vi.fn(),
    displayTestSummary: vi.fn(),
    displaySuccess: vi.fn(),
    displayError: vi.fn(),
    displayInfo: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a mock inquirer instance
 */
export function createMockInquirer(
  overrides: Partial<{
    prompt: (questions: any[]) => Promise<any>;
  }> = {}
) {
  return {
    prompt: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

/**
 * Creates a mock spinner
 */
export function createMockSpinner(
  overrides: Partial<{
    start: (text: string) => void;
    update: (text: string) => void;
    succeed: (text?: string) => void;
    fail: (text?: string) => void;
    warn: (text?: string) => void;
    stop: () => void;
    isSpinning: () => boolean;
  }> = {}
) {
  return {
    start: vi.fn(),
    update: vi.fn(),
    succeed: vi.fn(),
    fail: vi.fn(),
    warn: vi.fn(),
    stop: vi.fn(),
    isSpinning: vi.fn().mockReturnValue(false),
    ...overrides,
  };
}
