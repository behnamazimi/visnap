/**
 * Error handling utilities
 */

/**
 * Custom error classes for better error handling
 */
export class ViSnapError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = "ViSnapError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory function to create VTT error classes with consistent structure
 */
function createViSnapError(name: string, code: string) {
  return class extends ViSnapError {
    constructor(message: string, originalError?: Error) {
      super(message, code, originalError);
      this.name = name;
    }
  };
}

export const ConfigError = createViSnapError("ConfigError", "CONFIG_ERROR");
export const BrowserError = createViSnapError("BrowserError", "BROWSER_ERROR");
export const TestCaseError = createViSnapError(
  "TestCaseError",
  "TEST_CASE_ERROR"
);
export const ScreenshotError = createViSnapError(
  "ScreenshotError",
  "SCREENSHOT_ERROR"
);

/**
 * Safely extracts error message from unknown error type
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
