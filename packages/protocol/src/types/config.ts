/**
 * @fileoverview Configuration types for Visnap visual testing framework
 *
 * This module defines types related to configuration and CLI options.
 */

import type { BrowserAdapterOptions, TestCaseAdapterOptions } from "./adapters";
import type { ComparisonConfig } from "./comparison";
import type { ViewportMap } from "./core";

/**
 * Main configuration interface for the visual testing tool
 * @property adapters - Browser and test case adapter configurations
 * @property comparison - Image comparison configuration
 * @property screenshotDir - Directory to store screenshots (default: "visnap")
 * @property runtime - Runtime behavior configuration
 * @property viewport - Global viewport configurations
 * @property reporter - Report generation configuration
 */
export interface VisualTestingToolConfig {
  adapters: {
    browser: BrowserAdapterOptions;
    testCase: TestCaseAdapterOptions[];
  };
  comparison?: ComparisonConfig;
  screenshotDir?: string;
  runtime?: {
    /**
     * Maximum concurrency configuration.
     * - number: applies to both capture and compare
     * - object: specify separate limits for capture and compare
     */
    maxConcurrency?: number | { capture?: number; compare?: number };
    /** Suppress output except errors; defaults to false */
    quiet?: boolean;
  };
  /** Global viewport configuration that applies to all test cases unless overridden */
  viewport?: ViewportMap;
  /** Reporter configuration for HTML and JSON reports */
  reporter?: {
    html?: boolean | string; // true/false or custom path
    json?: boolean | string; // true/false or custom path
  };
}

/**
 * Command line interface options
 * @property include - Include patterns for filtering test cases
 * @property exclude - Exclude patterns for filtering test cases
 * @property configPath - Path to configuration file
 * @property quiet - Suppress output except errors
 */
export interface CliOptions {
  include?: string | string[];
  exclude?: string | string[];
  configPath?: string;
  quiet?: boolean;
}

/**
 * Filter options for test case selection (excludes config and quiet options)
 */
export type FilterOptions = Omit<CliOptions, "configPath" | "quiet">;
