/**
 * Input validation utilities
 */

import { existsSync } from "fs";
import { resolve } from "path";

import { ConfigError } from "./error-handler";

/**
 * Validates that a path is safe (no directory traversal)
 */
export function validateSafePath(path: string): boolean {
  const resolved = resolve(path);
  const cwd = process.cwd();
  return resolved.startsWith(cwd);
}

/**
 * Validates and resolves a safe path
 */
export function resolveSafePath(path: string): string {
  if (!validateSafePath(path)) {
    throw new ConfigError(`Unsafe path detected: ${path}`);
  }
  return resolve(path);
}

/**
 * Validates that a directory exists
 */
export function validateDirectoryExists(path: string): void {
  if (!existsSync(path)) {
    throw new ConfigError(`Directory does not exist: ${path}`);
  }
}

/**
 * Validates browser name
 */
export function validateBrowserName(
  browser: string
): browser is "chromium" | "firefox" | "webkit" {
  return ["chromium", "firefox", "webkit"].includes(browser);
}

/**
 * Validates threshold value (0-1)
 */
export function validateThreshold(threshold: number): void {
  if (
    typeof threshold !== "number" ||
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new ConfigError(
      `Invalid threshold value: ${threshold}. Must be a number between 0 and 1.`
    );
  }
}

/**
 * Validates concurrency value (positive integer)
 */
export function validateConcurrency(concurrency: number): void {
  if (
    typeof concurrency !== "number" ||
    !Number.isFinite(concurrency) ||
    concurrency <= 0 ||
    !Number.isInteger(concurrency)
  ) {
    throw new ConfigError(
      `Invalid concurrency value: ${concurrency}. Must be a positive integer.`
    );
  }
}

/**
 * Validates screenshot target selector
 */
export function validateScreenshotTarget(target: string): void {
  if (typeof target !== "string" || target.trim().length === 0) {
    throw new ConfigError(
      `Invalid screenshot target: ${target}. Must be a non-empty string.`
    );
  }
}

/**
 * Validates URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates storybook source (URL or local path)
 */
export function validateStorybookSource(source: string): void {
  if (typeof source !== "string" || source.trim().length === 0) {
    throw new ConfigError(
      `Invalid storybook source: ${source}. Must be a non-empty string.`
    );
  }

  const isUrl = /^https?:\/\//i.test(source);
  if (isUrl) {
    if (!validateUrl(source)) {
      throw new ConfigError(`Invalid storybook URL: ${source}`);
    }
  } else {
    // Local path - validate it's safe
    resolveSafePath(source);
  }
}

/**
 * Validates include/exclude patterns
 */
export function validatePatterns(
  patterns: string | string[] | undefined
): string[] {
  if (!patterns) return [];

  const patternArray = Array.isArray(patterns) ? patterns : [patterns];

  for (const pattern of patternArray) {
    if (typeof pattern !== "string" || pattern.trim().length === 0) {
      throw new ConfigError(
        `Invalid pattern: ${pattern}. Must be a non-empty string.`
      );
    }
  }

  return patternArray;
}
