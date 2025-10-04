/**
 * Application constants
 */

// Default values
export const DEFAULT_CONCURRENCY = 2;
export const DEFAULT_SCREENSHOT_DIR = "visual-testing";
export const DEFAULT_THRESHOLD = 0.1;
export const DEFAULT_BROWSER = "chromium" as const;
export const DEFAULT_SCREENSHOT_TARGET = "story-root" as const;

// Timeouts (in milliseconds)
export const STORYBOOK_READY_TIMEOUT = 10000;
export const PAGE_LOAD_TIMEOUT = 30000;

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

export const DEFAULT_DOCKER_IMAGE = "visual-testing-tool/latest";
