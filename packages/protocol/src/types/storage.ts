/**
 * @fileoverview Storage types for Visnap visual testing framework
 *
 * This module defines types related to storage adapters for managing screenshot files.
 */

/**
 * Storage directory types for organizing screenshots
 * @property "base" - Baseline screenshots for comparison
 * @property "current" - Current screenshots from test runs
 * @property "diff" - Difference images showing changes
 */
export type StorageKind = "base" | "current" | "diff";

// StorageAdapter is defined in comparison.ts to avoid circular dependencies
