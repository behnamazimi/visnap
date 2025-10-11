export type BrowserName = "chromium" | "firefox" | "webkit" | (string & {});

export type ComparisonCore = "odiff" | "pixelmatch";

export interface ComparisonConfig {
  core: ComparisonCore;
  threshold: number;
  diffColor?: string;
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

// ============= Interaction Option Types =============

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

export interface HoverOptions {
  position?: { x: number; y: number };
  modifiers?: Array<"Alt" | "Control" | "Meta" | "Shift">;
  force?: boolean;
  timeout?: number;
}

export interface TypeOptions {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
}

export interface FillOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

export interface SelectOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

export interface CheckOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  timeout?: number;
}

export interface PressOptions {
  delay?: number;
  noWaitAfter?: boolean;
  timeout?: number;
}

export interface FocusOptions {
  timeout?: number;
}

export interface ScrollOptions {
  behavior?: "auto" | "smooth";
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
  timeout?: number;
}

export interface DragAndDropOptions {
  force?: boolean;
  noWaitAfter?: boolean;
  sourcePosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  timeout?: number;
}

export interface WaitForSelectorOptions {
  state?: "attached" | "detached" | "visible" | "hidden";
  timeout?: number;
}

export interface WaitForLoadStateOptions {
  timeout?: number;
}

export interface SetInputFilesOptions {
  noWaitAfter?: boolean;
  timeout?: number;
}

// ============= Main Interaction Action Type =============

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

export interface BrowserConfig {
  name: BrowserName;
  options?: Record<string, unknown>;
}

export type BrowserConfiguration = BrowserName | BrowserConfig;

export type ViewportMap = Record<string, Viewport>;

export interface ScreenshotOptions {
  id: string;
  url: string;
  screenshotTarget?: string;
  viewport?: Viewport;
  waitFor?: string | number;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
}

export interface ScreenshotResult {
  buffer: Uint8Array;
  meta: { elapsedMs: number; viewportKey?: string; id: string };
}

// Standardized comparison reasons for non-matching results
export type CompareReason =
  | "pixel-diff"
  | "missing-current"
  | "missing-base"
  | "error";

// Aggregate outcome for a run to aid CI reporting
export interface RunOutcome {
  total: number;
  passed: number;
  failedDiffs: number;
  failedMissingCurrent: number;
  failedMissingBase: number;
  failedErrors: number; // non-standard errors
  captureFailures: number; // number of captures that failed prior to compare
}

export interface TestCaseVisualConfig {
  skip?: boolean;
  screenshotTarget?: string;
  threshold?: number;
  browser?: BrowserName | BrowserName[];
  viewport?: Viewport;
  disableCSSInjection?: boolean;
  interactions?: InteractionAction[];
}

// Base meta fields common to all test case-related types
interface BaseTestCaseMeta {
  id: string;
  title: string;
  kind: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
}

// Base instance fields for a concrete, runnable test case instance
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
}

export interface TestCaseMeta extends BaseTestCaseMeta {
  visualTesting?: TestCaseVisualConfig;
}

export type TestCaseInstance = BaseTestCaseInstance;

// Extended instance shape that also carries minimal meta fields so it is assignable to TestCaseMeta
export interface TestCaseInstanceMeta
  extends BaseTestCaseMeta,
    BaseTestCaseInstance {
  visualTesting?: TestCaseVisualConfig;
}

export interface BrowserAdapterInitOptions {
  browser: BrowserName;
  viewport?: ViewportMap;
}

export interface BrowserAdapter {
  name: string;
  init(opts: BrowserAdapterInitOptions): Promise<void> | void;
  openPage(url: string): Promise<PageWithEvaluate | void>;
  capture(opts: ScreenshotOptions): Promise<ScreenshotResult>;
  dispose(): Promise<void> | void;
}

export interface TestCaseAdapterStartResult {
  // Provide when the adapter serves a directory or is bound to a known remote.
  // If omitted, expand() must return absolute URLs.
  baseUrl?: string;
  // Initial page URL for the adapter to discover test cases
  initialPageUrl?: string;
}

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

// Adapter configuration types
export interface BrowserAdapterOptions {
  name: string;
  options?: {
    browser?: BrowserConfiguration | BrowserConfiguration[];
    [key: string]: unknown;
  };
}

export interface TestCaseAdapterOptions {
  name: string;
  options?: {
    source: string;
    port?: number;
    include?: string | string[];
    exclude?: string | string[];
  };
}

export interface VisualTestingToolConfig {
  adapters: {
    browser: BrowserAdapterOptions;
    testCase: TestCaseAdapterOptions[];
  };
  comparison?: ComparisonConfig;
  screenshotDir?: string;
  runtime?: {
    /** Maximum number of concurrent captures to run; defaults to 4 */
    maxConcurrency?: number;
    /** Suppress output except errors; defaults to false */
    quiet?: boolean;
  };
  /** Global viewport configuration that applies to all test cases unless overridden */
  viewport?: ViewportMap;
}

export type PageWithEvaluate = {
  evaluate?: (fn: () => Promise<unknown>) => Promise<unknown>;
  close?: () => Promise<void>;
};
