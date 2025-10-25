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
export const DEFAULT_COMPARISON_CORE = "odiff" as const;
export const DEFAULT_DIFF_COLOR = "#00ff00";

// Timeouts (in milliseconds)

/** 30 second timeout per capture - prevents hanging on problematic pages */
export const DEFAULT_CAPTURE_TIMEOUT_MS = 30000;

// File extensions
export const CONFIG_FILE_EXTENSIONS = {
  typescript: ".ts",
  javascript: ".js",
} as const;

export const DEFAULT_DOCKER_IMAGE = "visnap/visnap:latest";
