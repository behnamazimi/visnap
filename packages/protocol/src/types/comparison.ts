/**
 * @fileoverview Comparison types for Visnap visual testing framework
 *
 * This module defines types related to image comparison engines and configuration.
 */

/**
 * Storage adapter interface for managing screenshot files
 * This is a forward declaration to avoid circular dependencies
 */
export interface StorageAdapter {
  write(
    kind: "base" | "current" | "diff",
    filename: string,
    buffer: Uint8Array
  ): Promise<string>;
  read(
    kind: "base" | "current" | "diff",
    filename: string
  ): Promise<Uint8Array>;
  getReadablePath(
    kind: "base" | "current" | "diff",
    filename: string
  ): Promise<string>;
  exists(kind: "base" | "current" | "diff", filename: string): Promise<boolean>;
  list(kind: "base" | "current" | "diff"): Promise<string[]>;
  cleanup?(): Promise<void>;
}

/**
 * Comparison engine type supporting built-in engines or custom implementations
 * @example "odiff" | "pixelmatch" | "custom-engine"
 */
export type ComparisonCore = "odiff" | "pixelmatch" | (string & {});

/**
 * Comparison engine interface for implementing custom image comparison logic
 * @property name - Unique identifier for the comparison engine
 * @method compare - Compares two images and returns match result with optional diff details
 */
export interface ComparisonEngine {
  name: string;
  compare(
    storage: StorageAdapter,
    filename: string,
    options: { threshold: number; diffColor?: string }
  ): Promise<{ match: boolean; reason: string; diffPercentage?: number }>;
}

/**
 * Configuration for image comparison
 * @property core - Comparison engine to use
 * @property threshold - Pixel difference threshold (0-1 range, where 0.1 = 10% difference allowed)
 * @property diffColor - Hex color for highlighting differences in diff images (default: "#00ff00")
 */
export interface ComparisonConfig {
  core: ComparisonCore;
  threshold: number;
  diffColor?: string;
}

/**
 * Standardized comparison reasons for non-matching results
 * @property "pixel-diff" - Images differ by more than threshold
 * @property "missing-current" - Current screenshot not found
 * @property "missing-base" - Baseline screenshot not found
 * @property "error" - Error occurred during comparison
 */
export type CompareReason =
  | "pixel-diff"
  | "missing-current"
  | "missing-base"
  | "error";
