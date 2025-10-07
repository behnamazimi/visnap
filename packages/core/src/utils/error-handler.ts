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

export class ConfigError extends VTTError {
  constructor(message: string, originalError?: Error) {
    super(message, "CONFIG_ERROR", originalError);
    this.name = "ConfigError";
  }
}

export class BrowserError extends VTTError {
  constructor(message: string, originalError?: Error) {
    super(message, "BROWSER_ERROR", originalError);
    this.name = "BrowserError";
  }
}

export class TestCaseError extends VTTError {
  constructor(message: string, originalError?: Error) {
    super(message, "TEST_CASE_ERROR", originalError);
    this.name = "TestCaseError";
  }
}

export class ScreenshotError extends VTTError {
  constructor(message: string, originalError?: Error) {
    super(message, "SCREENSHOT_ERROR", originalError);
    this.name = "ScreenshotError";
  }
}

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
