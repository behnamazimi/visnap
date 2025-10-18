/**
 * @fileoverview Protocol types and interfaces for Visnap visual testing framework
 *
 * This module defines the core protocol that all adapters and packages must implement.
 * It includes types for browsers, viewports, screenshots, test cases, adapters, storage,
 * configuration, and test results.
 *
 * @module @visnap/protocol
 */

// ============= Core Types =============

/**
 * Browser name type supporting chromium, firefox, webkit, or custom browser names
 * @example "chromium" | "firefox" | "webkit" | "chrome-beta"
 */
export type BrowserName = "chromium" | "firefox" | "webkit" | (string & {});

/**
 * Viewport configuration for screenshot capture
 * @property width - Viewport width in pixels
 * @property height - Viewport height in pixels
 * @property deviceScaleFactor - Device pixel ratio (default: 1)
 */
export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

// ============= Comparison Types =============

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

// ============= Interaction Types =============

/**
 * Options for click interactions
 * @property button - Mouse button to use (default: "left")
 * @property clickCount - Number of clicks (default: 1)
 * @property delay - Delay between mousedown and mouseup in milliseconds
 * @property position - Click position relative to element's top-left corner
 * @property modifiers - Keyboard modifiers to press during click
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface ClickOptions {
  button?: "left" | "right" | "middle";
  clickCount?: number;
  delay?: number;
  position?: { x: number; y: number };
  modifiers?: Array<"Alt" | "Control" | "Meta" | "Shift">;
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for hover interactions
 * @property position - Hover position relative to element's top-left corner
 * @property modifiers - Keyboard modifiers to press during hover
 * @property force - Skip actionability checks (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface HoverOptions {
  position?: { x: number; y: number };
  modifiers?: Array<"Alt" | "Control" | "Meta" | "Shift">;
  force?: boolean;
  timeout?: number;
}

/**
 * Options for typing interactions
 * @property delay - Delay between key presses in milliseconds
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface TypeOptions {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for fill interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface FillOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for select interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface SelectOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for check/uncheck interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface CheckOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for key press interactions
 * @property delay - Delay between keydown and keyup in milliseconds
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface PressOptions {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
}

/**
 * Options for focus interactions
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface FocusOptions {
  timeout?: number;
}

/**
 * Options for scroll interactions
 * @property behavior - Scroll behavior (default: "auto")
 * @property block - Vertical alignment (default: "start")
 * @property inline - Horizontal alignment (default: "nearest")
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface ScrollOptions {
  behavior?: "auto" | "smooth";
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
  timeout?: number;
}

/**
 * Options for drag and drop interactions
 * @property force - Skip actionability checks (default: false)
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property sourcePosition - Starting position for drag (relative to source element)
 * @property targetPosition - Ending position for drop (relative to target element)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface DragAndDropOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  timeout?: number;
}

/**
 * Options for wait for selector interactions
 * @property state - Element state to wait for (default: "attached")
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface WaitForSelectorOptions {
  state?: "attached" | "detached" | "visible" | "hidden";
  timeout?: number;
}

/**
 * Options for wait for load state interactions
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface WaitForLoadStateOptions {
  timeout?: number;
}

/**
 * Options for set input files interactions
 * @property noWaitAfter - Don't wait for navigations after action (default: false)
 * @property timeout - Maximum time to wait in milliseconds
 */
export interface SetInputFilesOptions {
  noWaitAfter?: boolean;
  timeout?: number;
}

// ============= Main Interaction Action Type =============

/**
 * Union type representing all possible interaction actions that can be performed
 * before taking a screenshot. Each action includes a type and required parameters.
 *
 * @example
 * ```typescript
 * const interactions: InteractionAction[] = [
 *   { type: "click", selector: "#button" },
 *   { type: "type", selector: "#input", text: "Hello World" },
 *   { type: "wait", selector: "#loading", options: { state: "hidden" } }
 * ];
 * ```
 */
export type InteractionAction =
  // Click actions
  | { type: "click"; selector: string; options?: ClickOptions }
  | { type: "dblclick"; selector: string; options?: ClickOptions }

  // Hover/Focus actions
  | { type: "hover"; selector: string; options?: HoverOptions }
  | { type: "focus"; selector: string; options?: FocusOptions }
  | { type: "blur"; selector: string; options?: { timeout?: number } }

  // Input actions
  | { type: "type"; selector: string; text: string; options?: TypeOptions }
  | { type: "fill"; selector: string; text: string; options?: FillOptions }
  | { type: "clear"; selector: string; options?: { timeout?: number } }
  | { type: "press"; selector: string; key: string; options?: PressOptions }

  // Selection actions
  | {
      type: "select";
      selector: string;
      value: string | string[];
      options?: SelectOptions;
    }
  | {
      type: "selectOption";
      selector: string;
      values: Array<{ value?: string; label?: string; index?: number }>;
      options?: SelectOptions;
    }

  // Checkbox/Radio actions
  | { type: "check"; selector: string; options?: CheckOptions }
  | { type: "uncheck"; selector: string; options?: CheckOptions }
  | {
      type: "setChecked";
      selector: string;
      checked: boolean;
      options?: CheckOptions;
    }

  // File upload
  | {
      type: "setInputFiles";
      selector: string;
      files: string | string[];
      options?: SetInputFilesOptions;
    }

  // Scroll actions
  | { type: "scrollIntoView"; selector: string; options?: ScrollOptions }

  // Drag and drop
  | {
      type: "dragAndDrop";
      sourceSelector: string;
      targetSelector: string;
      options?: DragAndDropOptions;
    }

  // Wait actions
  | { type: "wait"; selector: string; options?: WaitForSelectorOptions }
  | { type: "waitForTimeout"; duration: number }
  | {
      type: "waitForLoadState";
      state?: "load" | "domcontentloaded" | "networkidle";
      options?: WaitForLoadStateOptions;
    };

// ============= Browser Types =============

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

/**
 * Map of viewport names to viewport configurations
 * @example { "desktop": { width: 1920, height: 1080 }, "mobile": { width: 375, height: 667 } }
 */
export type ViewportMap = Record<string, Viewport>;

// ============= Screenshot Types =============

/**
 * Options for screenshot capture
 * @property id - Unique identifier for this screenshot
 * @property url - URL to capture
 * @property screenshotTarget - CSS selector for the element to capture (default: "body")
 * @property viewport - Viewport configuration for capture
 * @property waitFor - Selector or timeout to wait for before capture
 * @property disableCSSInjection - Skip injecting global CSS (default: false)
 * @property interactions - Actions to perform before capture
 * @property elementsToMask - CSS selectors of elements to mask before capture
 */
export interface ScreenshotOptions {
  id: string;
  url: string;
  screenshotTarget?: string;
  viewport?: Viewport;
  waitFor?: string | number;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
  /** CSS selectors of elements to mask (overlay) before capture */
  elementsToMask?: string[];
}

/**
 * Result of a screenshot capture operation
 * @property buffer - PNG image data as Uint8Array
 * @property meta - Metadata about the capture operation
 * @property meta.elapsedMs - Time taken to capture in milliseconds
 * @property meta.viewportKey - Viewport configuration key used
 * @property meta.id - Screenshot identifier
 */
export interface ScreenshotResult {
  buffer: Uint8Array;
  meta: { elapsedMs: number; viewportKey?: string; id: string };
}

// ============= Test Result Types =============

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

/**
 * Complete test result containing outcome, failures, and configuration
 * @property success - Whether all tests passed
 * @property outcome - Detailed outcome statistics
 * @property exitCode - Process exit code (0 for success, 1 for failure)
 * @property failures - Array of test failures with diff details
 * @property captureFailures - Array of capture failures with error details
 * @property config - Configuration used for the test run
 */
export interface TestResult {
  success: boolean;
  outcome: RunOutcome;
  exitCode: number;
  failures?: Array<{
    id: string;
    reason: string;
    diffPercentage?: number;
  }>;
  captureFailures?: Array<{
    id: string;
    error: string;
  }>;
  config?: {
    screenshotDir?: string;
    adapters?: {
      browser?: { name: string; options?: Record<string, unknown> };
      testCase?: Array<{ name: string; options?: Record<string, unknown> }>;
    };
    comparison?: ComparisonConfig;
    runtime?: {
      maxConcurrency?: number | { capture?: number; compare?: number };
      quiet?: boolean;
    };
    viewport?: ViewportMap;
    reporter?: {
      html?: boolean | string;
      json?: boolean | string;
    };
  };
}

/**
 * Detailed information about a single test case execution
 * @property id - Test case identifier
 * @property captureFilename - Name of the captured screenshot file
 * @property captureDurationMs - Time taken to capture screenshot
 * @property comparisonDurationMs - Time taken to compare images
 * @property totalDurationMs - Total time for this test case
 * @property status - Test case status
 * @property reason - Failure reason if status is not "passed"
 * @property diffPercentage - Percentage of pixels that differ (if applicable)
 * @property title - Human-readable test case title
 * @property kind - Test case type (e.g., "story", "url")
 * @property browser - Browser used for this test case
 * @property viewport - Viewport configuration used
 */
export interface TestCaseDetail {
  id: string;
  captureFilename: string;
  captureDurationMs: number;
  comparisonDurationMs?: number;
  totalDurationMs: number;
  status: "passed" | "failed" | "capture-failed";
  reason?: string;
  diffPercentage?: number;
  title?: string;
  kind?: string;
  browser?: string;
  viewport?: string;
}

/**
 * Duration statistics for a test run
 * @property totalCaptureDurationMs - Total time spent capturing screenshots
 * @property totalComparisonDurationMs - Total time spent comparing images
 * @property totalDurationMs - Total time for the entire test run
 */
export interface TestDurations {
  totalCaptureDurationMs: number;
  totalComparisonDurationMs: number;
  totalDurationMs: number;
}

/**
 * Aggregate outcome for a test run to aid CI reporting
 * @property total - Total number of test cases
 * @property passed - Number of test cases that passed
 * @property failedDiffs - Number of test cases that failed due to pixel differences
 * @property failedMissingCurrent - Number of test cases missing current screenshots
 * @property failedMissingBase - Number of test cases missing baseline screenshots
 * @property failedErrors - Number of test cases that failed due to errors
 * @property captureFailures - Number of captures that failed before comparison
 * @property testCases - Detailed information about each test case
 * @property durations - Duration statistics for the test run
 */
export interface RunOutcome {
  total: number;
  passed: number;
  failedDiffs: number;
  failedMissingCurrent: number;
  failedMissingBase: number;
  failedErrors: number; // non-standard errors
  captureFailures: number; // number of captures that failed prior to compare
  testCases?: TestCaseDetail[];
  durations?: TestDurations;
}

/**
 * Visual testing configuration for a specific test case
 * @property skip - Whether to skip this test case
 * @property screenshotTarget - CSS selector for element to capture
 * @property threshold - Pixel difference threshold for this test case
 * @property browser - Browser(s) to use for this test case
 * @property viewport - Viewport configuration for this test case
 * @property disableCSSInjection - Skip injecting global CSS for this test case
 * @property interactions - Actions to perform before capture
 * @property elementsToMask - CSS selectors of elements to mask before capture
 */
export interface TestCaseVisualConfig {
  skip?: boolean;
  screenshotTarget?: string;
  threshold?: number;
  browser?: BrowserName | BrowserName[];
  viewport?: Viewport;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
  /** CSS selectors of elements to mask (overlay) before capture */
  elementsToMask?: string[];
}

/**
 * Base metadata fields common to all test case-related types
 * @property id - Unique identifier for the test case
 * @property title - Human-readable title
 * @property kind - Type of test case (e.g., "story", "url")
 * @property parameters - Additional parameters specific to the test case type
 * @property tags - Tags for categorizing test cases
 */
interface BaseTestCaseMeta {
  id: string;
  title: string;
  kind: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
}

/**
 * Base instance fields for a concrete, runnable test case instance
 * @property caseId - Identifier for the test case
 * @property variantId - Identifier for this specific variant (e.g., viewport key)
 * @property url - URL to test (absolute or relative; if relative, core will prefix adapter.start().baseUrl)
 * @property screenshotTarget - CSS selector for element to capture
 * @property viewport - Viewport configuration for this instance
 * @property browser - Browser for this specific variant
 * @property threshold - Optional per-case threshold applied during comparison
 * @property disableCSSInjection - Optional flag to disable CSS injection
 * @property interactions - Optional interactions to execute before screenshot
 * @property elementsToMask - CSS selectors of elements to mask before capture
 */
interface BaseTestCaseInstance {
  caseId: string;
  variantId: string;
  url: string; // absolute or relative; if relative, core will prefix adapter.start().baseUrl
  screenshotTarget?: string;
  viewport?: Viewport;
  browser?: BrowserName; // Browser for this specific variant
  /** Optional per-case threshold applied during comparison for this instance */
  threshold?: number;
  /** Optional flag to disable CSS injection for this specific test case */
  disableCSSInjection?: boolean;
  /** Optional interactions to execute before screenshot */
  interactions?: InteractionAction[];
  /** CSS selectors of elements to mask (overlay) before capture */
  elementsToMask?: string[];
}

/**
 * Test case metadata including visual testing configuration
 * @property visualTesting - Visual testing specific configuration
 */
export interface TestCaseMeta extends BaseTestCaseMeta {
  visualTesting?: TestCaseVisualConfig;
}

/**
 * A concrete test case instance ready for execution
 */
export type TestCaseInstance = BaseTestCaseInstance;

/**
 * Extended test case instance that includes both metadata and instance fields
 * This allows the instance to be assignable to TestCaseMeta when needed
 */
export interface TestCaseInstanceMeta
  extends BaseTestCaseMeta,
    BaseTestCaseInstance {
  visualTesting?: TestCaseVisualConfig;
}

// ============= Adapter Types =============

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
interface TestCaseAdapterOptions<T = Record<string, unknown>> {
  name: string;
  options?: T;
}

// ============= Storage Types =============

/**
 * Storage directory types for organizing screenshots
 * @property "base" - Baseline screenshots for comparison
 * @property "current" - Current screenshots from test runs
 * @property "diff" - Difference images showing changes
 */
export type StorageKind = "base" | "current" | "diff";

/**
 * Storage adapter interface for managing screenshot files
 * @method write - Write screenshot data to storage
 * @method read - Read screenshot data from storage
 * @method getReadablePath - Get a readable file path for external tools
 * @method exists - Check if a file exists in storage
 * @method list - List all files in a storage directory
 * @method cleanup - Optional: Clean up storage resources
 */
export interface StorageAdapter {
  write(
    kind: StorageKind,
    filename: string,
    buffer: Uint8Array
  ): Promise<string>;
  read(kind: StorageKind, filename: string): Promise<Uint8Array>;
  getReadablePath(kind: StorageKind, filename: string): Promise<string>;
  exists(kind: StorageKind, filename: string): Promise<boolean>;
  list(kind: StorageKind): Promise<string[]>;
  cleanup?(): Promise<void>;
}

// ============= Configuration Types =============

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

// ============= Utility Types =============

/**
 * Page context interface with evaluation capabilities
 * Used by adapters that need to execute code in the browser context
 * @property evaluate - Optional function to execute code in browser context
 * @property close - Optional function to close the page context
 */
export type PageWithEvaluate = {
  evaluate?: (fn: () => Promise<unknown>) => Promise<unknown>;
  close?: () => Promise<void>;
};

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

// ============= Viewport Utilities =============

/**
 * Default viewport configuration
 * @example { width: 1920, height: 1080 }
 */
export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

// ============= Error Types (shared) =============

/**
 * Error thrown when storage operations fail
 * @property code - Error code for programmatic error handling
 */
export class StorageError extends Error {
  public readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
    this.code = "STORAGE_ERROR";
  }
}
