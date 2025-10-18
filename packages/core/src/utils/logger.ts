/**
 * @fileoverview Logging utilities
 *
 * Consistent logging interface with different log levels and styling.
 * Supports quiet mode and color-coded messages for better readability.
 */

import chalk from "chalk";

type Logger = {
  /** Logs a plain message. */
  plain: (message: string, force?: boolean) => void;
  /** Logs an informational message. */
  info: (message: string, force?: boolean) => void;
  /** Logs a warning message. */
  warn: (message: string, force?: boolean) => void;
  /** Logs a success message. */
  success: (message: string, force?: boolean) => void;
  /** Logs an error message. */
  error: (message: string, force?: boolean) => void;
  /** Logs a dimmed message. */
  dim: (message: string, force?: boolean) => void;
  /** Logs a debug message with additional arguments. */
  debug: (message: string, ...args: unknown[]) => void;
};

let _isQuiet = false;

/**
 * Sets the quiet mode state for the logger.
 * @param quiet - Whether to enable quiet mode
 */
export function setQuietMode(quiet: boolean): void {
  _isQuiet = quiet;
}

/**
 * Internal function to check if quiet mode is enabled.
 * @returns True if quiet mode is enabled
 */
const isQuietMode = () => _isQuiet;

/**
 * Checks if quiet mode is currently enabled.
 * @returns True if quiet mode is enabled
 */
export function isQuiet(): boolean {
  return _isQuiet;
}

const logger: Logger = Object.freeze({
  plain: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(message);
    }
  },
  info: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(`${chalk.cyan("i")} ${message}`);
    }
  },
  warn: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.warn(`${chalk.yellow("!")} ${message}`);
    }
  },
  success: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(`${chalk.green("✔")} ${message}`);
    }
  },
  error: (message: string, _force = false) => {
    // Error always shows, but we can still respect force parameter for consistency
    console.error(`${chalk.red("✖")} ${message}`);
  },
  dim: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(chalk.dim(message));
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (!isQuietMode()) {
      console.log(chalk.gray(`🐛 ${message}`), ...args);
    }
  },
});

export default logger;
export const log = logger;
