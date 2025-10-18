/**
 * @fileoverview Adapter loading utilities
 *
 * Dynamically loads browser adapters, test case adapters, and storage adapters
 * based on configuration. Includes error handling and adapter pooling.
 */

// Re-export all adapter loading functionality from split modules
export * from "./loader/browser-adapter-loader";
export * from "./loader/testcase-adapter-loader";
export * from "./loader/storage-adapter-loader";
export * from "./loader/error-formatter";
export * from "./browser-pool";
