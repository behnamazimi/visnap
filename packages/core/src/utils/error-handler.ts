/**
 * @fileoverview Error handling utilities for core library
 *
 * Custom error classes and utilities for consistent error handling
 * throughout the visual testing tool.
 */

/**
 * Base error class for all ViSnap-related errors.
 */
export class ViSnapError extends Error {
  /** Unique error code for programmatic error handling. */
  public readonly code: string;
  /** Original error that caused this error, if any. */
  public readonly originalError?: Error;

  /**
   * Creates a new ViSnapError instance.
   * @param message - Human-readable error message
   * @param code - Unique error code for programmatic handling
   * @param originalError - Original error that caused this error
   */
  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = "ViSnapError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory function to create ViSnap error classes with consistent structure.
 * @param name - Name of the error class
 * @param code - Unique error code for the error class
 * @returns Error class constructor
 */
function createViSnapError(name: string, code: string) {
  return class extends ViSnapError {
    constructor(message: string, originalError?: Error) {
      super(message, code, originalError);
      this.name = name;
    }
  };
}

/** Error thrown when configuration is invalid or missing. */
export const ConfigError = createViSnapError("ConfigError", "CONFIG_ERROR");
/** Error thrown when browser operations fail. */
export const BrowserError = createViSnapError("BrowserError", "BROWSER_ERROR");
/** Error thrown when test case operations fail. */
export const TestCaseError = createViSnapError(
  "TestCaseError",
  "TEST_CASE_ERROR"
);
/** Error thrown when screenshot operations fail. */
export const ScreenshotError = createViSnapError(
  "ScreenshotError",
  "SCREENSHOT_ERROR"
);

/**
 * Safely extracts error message from unknown error type.
 * @param error - Error of unknown type
 * @returns String representation of the error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}
