/**
 * @fileoverview Adapter types for Visnap visual testing framework
 *
 * This module defines interfaces for browser adapters and test case adapters.
 */

import type { BrowserName, ViewportMap } from "./core";
import type {
  ScreenshotOptions,
  ScreenshotResult,
  PageWithEvaluate,
} from "./screenshots";
import type { TestCaseInstanceMeta } from "./test-cases";

/**
 * Options for initializing a browser adapter
 * @property browser - Browser to use
 * @property viewport - Viewport configurations to support
 */
export interface BrowserAdapterInitOptions {
  browser: BrowserName;
  viewport?: ViewportMap;
}

/**
 * Browser adapter interface for managing browser instances and capturing screenshots
 * @property name - Unique identifier for this adapter
 * @method init - Initialize the browser adapter with configuration
 * @method openPage - Open a new page at the given URL
 * @method capture - Capture a screenshot with the given options
 * @method dispose - Clean up browser resources
 */
export interface BrowserAdapter {
  name: string;
  init(opts: BrowserAdapterInitOptions): Promise<void> | void;
  openPage(url: string): Promise<PageWithEvaluate | void>;
  capture(opts: ScreenshotOptions): Promise<ScreenshotResult>;
  dispose(): Promise<void> | void;
}

/**
 * Result of starting a test case adapter
 * @property baseUrl - Base URL when adapter serves a directory or is bound to a known remote.
 *                    If omitted, listCases() must return absolute URLs.
 * @property initialPageUrl - Initial page URL for the adapter to discover test cases
 */
export interface TestCaseAdapterStartResult {
  // Provide when the adapter serves a directory or is bound to a known remote.
  // If omitted, expand() must return absolute URLs.
  baseUrl?: string;
  // Initial page URL for the adapter to discover test cases
  initialPageUrl?: string;
}

/**
 * Test case adapter interface for discovering and listing test cases
 * @property name - Unique identifier for this adapter
 * @method start - Optional: Start the adapter and return base URL if applicable
 * @method listCases - Return fully expanded concrete test case instances ready for capture
 * @method stop - Optional: Stop the adapter and clean up resources
 */
export interface TestCaseAdapter {
  name: string;
  // Optional: adapters that serve a directory or bind to a remote should return baseUrl.
  start?(): Promise<TestCaseAdapterStartResult | void>;
  // Returns fully expanded concrete instances ready for capture
  // If start() provided baseUrl, urls may be relative; otherwise, urls must be absolute.
  listCases(
    pageCtx?: PageWithEvaluate,
    opts?: { viewport?: ViewportMap }
  ): Promise<TestCaseInstanceMeta[]>;
  stop?(): Promise<void>;
}

/**
 * Browser adapter configuration
 * @property name - Adapter name
 * @property options - Adapter-specific options including browser configuration
 */
export interface BrowserAdapterOptions {
  name: string;
  options?: {
    browser?: BrowserConfiguration | BrowserConfiguration[];
    [key: string]: unknown;
  };
}

/**
 * Generic test case adapter options - consumers define their own specific options
 * @property name - Adapter name
 * @property options - Adapter-specific options
 */
export interface TestCaseAdapterOptions<T = Record<string, unknown>> {
  name: string;
  options?: T;
}

/**
 * Browser configuration with name and optional options
 * @property name - Browser name (chromium, firefox, webkit, or custom)
 * @property options - Browser-specific options passed to the underlying engine
 */
export interface BrowserConfig {
  name: BrowserName;
  options?: Record<string, unknown>;
}

/**
 * Browser configuration type - can be a simple name or full config object
 * @example "chromium" | { name: "chromium", options: { headless: false } }
 */
export type BrowserConfiguration = BrowserName | BrowserConfig;
