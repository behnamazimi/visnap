/**
 * @fileoverview Configuration management
 *
 * Loads, validates, and resolves configuration files and options.
 * Merges configurations and applies environment overrides.
 */

// Re-export all configuration functionality from split modules
export * from "./config/loader";
export * from "./config/resolver";
export * from "./config/env-overrides";
export * from "./config/logger";
