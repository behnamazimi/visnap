/**
 * @fileoverview Utilities barrel file
 *
 * Centralized exports for all utility functions and classes used throughout
 * the visual testing tool. Provides a clean interface for accessing utilities
 * from other packages and the CLI.
 */
export { getErrorMessage } from "./error-handler";
export { default as log, setQuietMode, isQuiet } from "./logger";
export { generateConfigContent } from "./config-generator";
export {
  createSafeViewport,
  validateViewport,
  DEFAULT_VIEWPORT,
} from "./viewport-validation";
export {
  createDirectoryConfig,
  validateDirectoryConfig,
  DEFAULT_DIRECTORY_CONFIG,
  type DirectoryConfig,
} from "./directory-config";
export {
  roundToDecimals,
  roundToTwoDecimals,
  PRECISION_MULTIPLIER,
  MIN_CONCURRENCY,
  FALLBACK_TIMEOUT,
} from "./math";
export { formatViewport } from "./viewport-formatting";
