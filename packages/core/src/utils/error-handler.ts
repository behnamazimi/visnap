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

export class StorybookError extends VTTError {
  constructor(message: string, originalError?: Error) {
    super(message, "STORYBOOK_ERROR", originalError);
    this.name = "StorybookError";
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

/**
 * Safely extracts error code from unknown error type
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof VTTError) {
    return error.code;
  }
  return "UNKNOWN_ERROR";
}

/**
 * Checks if error is a VTTError instance
 */
export function isVTTError(error: unknown): error is VTTError {
  return error instanceof VTTError;
}

/**
 * Wraps an unknown error in a VTTError with proper context
 */
export function wrapError(error: unknown, context: string): VTTError {
  const message = getErrorMessage(error);
  const originalError = error instanceof Error ? error : undefined;
  return new VTTError(`${context}: ${message}`, "WRAPPED_ERROR", originalError);
}

/**
 * Creates a standardized error message for browser launch failures
 */
export function createBrowserErrorMessage(
  browser: string,
  originalError: unknown
): string {
  const message = getErrorMessage(originalError);
  const hint = `Run: npx playwright@latest install ${browser}`;
  return `MISSING_BROWSER: Failed to launch ${browser}. ${hint}. Original: ${message}`;
}
