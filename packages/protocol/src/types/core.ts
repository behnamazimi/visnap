/**
 * @fileoverview Core types for Visnap visual testing framework
 *
 * This module defines the fundamental types used across the framework.
 */

/**
 * Browser name type supporting chromium, firefox, webkit, or custom browser names
 * @example "chromium" | "firefox" | "webkit" | "chrome-beta"
 */
export type BrowserName = "chromium" | "firefox" | "webkit" | (string & {});

/**
 * Viewport configuration for screenshot capture
 * @property width - Viewport width in pixels
 * @property height - Viewport height in pixels
 * @property deviceScaleFactor - Device pixel ratio (default: 1)
 */
export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

/**
 * Map of viewport names to viewport configurations
 * @example { "desktop": { width: 1920, height: 1080 }, "mobile": { width: 375, height: 667 } }
 */
export type ViewportMap = Record<string, Viewport>;

/**
 * Default viewport configuration
 * @example { width: 1920, height: 1080 }
 */
export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

/**
 * Error thrown when storage operations fail
 * @property code - Error code for programmatic error handling
 */
export class StorageError extends Error {
  public readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
    this.code = "STORAGE_ERROR";
  }
}
