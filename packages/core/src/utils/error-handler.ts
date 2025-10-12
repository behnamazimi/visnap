/**
 * Error handling utilities
 */

/**
 * Custom error classes for better error handling
 */
export class VTTError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = "VTTError";
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Factory function to create VTT error classes with consistent structure
 */
function createVTTError(name: string, code: string) {
  return class extends VTTError {
    constructor(message: string, originalError?: Error) {
      super(message, code, originalError);
      this.name = name;
    }
  };
}

export const ConfigError = createVTTError("ConfigError", "CONFIG_ERROR");
export const BrowserError = createVTTError("BrowserError", "BROWSER_ERROR");
export const TestCaseError = createVTTError("TestCaseError", "TEST_CASE_ERROR");
export const ScreenshotError = createVTTError(
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
