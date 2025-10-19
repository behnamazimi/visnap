/**
 * @fileoverview Protocol types and interfaces for Visnap visual testing framework
 *
 * This module defines the core protocol that all adapters and packages must implement.
 * It includes types for browsers, viewports, screenshots, test cases, adapters, storage,
 * configuration, and test results.
 *
 * @module @visnap/protocol
 */

// Re-export all types from domain-specific modules
export * from "./types/core";
export * from "./types/interactions";
export * from "./types/comparison";
export * from "./types/test-results";
export * from "./types/test-cases";
export * from "./types/adapters";
export * from "./types/storage";
export * from "./types/config";
export * from "./types/screenshots";
export * from "./constants";
