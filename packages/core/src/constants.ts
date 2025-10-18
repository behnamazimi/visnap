/**
 * @fileoverview Application constants
 *
 * Defines default values, timeouts, and configuration constants used throughout
 * the visual testing tool. These constants provide sensible defaults and ensure
 * consistency across the application.
 */

// Default values
/** Default concurrency level of 6 - balanced between performance and resource usage */
export const DEFAULT_CONCURRENCY = 6;
export const DEFAULT_SCREENSHOT_DIR = "visnap";
/** Default threshold of 0.1 (10%) for pixel difference tolerance */
export const DEFAULT_THRESHOLD = 0.1;
export const DEFAULT_BROWSER = "chromium" as const;
export const DEFAULT_SCREENSHOT_TARGET = "story-root" as const;
export const DEFAULT_COMPARISON_CORE = "odiff" as const;
export const DEFAULT_DIFF_COLOR = "#00ff00";

// Timeouts (in milliseconds)
/** 10 second timeout for Storybook to be ready - allows for slow startup */
export const STORYBOOK_READY_TIMEOUT = 10000;
/** 30 second timeout for page load - accommodates slow networks and complex pages */
export const PAGE_LOAD_TIMEOUT = 30000;

/** 30 second timeout per capture - prevents hanging on problematic pages */
export const DEFAULT_CAPTURE_TIMEOUT_MS = 30000;

// Server configuration
export const DEFAULT_SERVER_PORT = 4477;

// File extensions
export const PNG_EXTENSION = ".png";
export const CONFIG_FILE_EXTENSIONS = {
  typescript: ".ts",
  javascript: ".js",
} as const;

// Storybook selectors
export const STORYBOOK_SELECTORS = {
  ROOT: "#storybook-root",
  BODY: "body",
} as const;

export const DEFAULT_DOCKER_IMAGE = "visnap:latest";
