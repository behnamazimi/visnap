export type BrowserName = "chromium" | "firefox" | "webkit" | (string & {});

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

export type ViewportMap = Record<string, Viewport>;

export interface ScreenshotOptions {
  id: string;
  url: string;
  screenshotTarget?: string;
  viewport?: Viewport;
  waitFor?: string | number;
}

export interface ScreenshotResult {
  buffer: Uint8Array;
  meta: { elapsedMs: number; viewportKey?: string; id: string };
}

export interface TestCaseVisualConfig {
  skip?: boolean;
  screenshotTarget?: string;
  threshold?: number;
  browser?: BrowserName | BrowserName[];
  viewport?: Viewport;
}

// Base meta fields common to all test case-related types
interface BaseTestCaseMeta {
  id: string;
  title: string;
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
  /** Optional per-case threshold applied during comparison for this instance */
  threshold?: number;
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
  init?(opts: BrowserAdapterInitOptions): Promise<void> | void;
  openPage?(url: string): Promise<any>;
  capture(opts: ScreenshotOptions): Promise<ScreenshotResult>;
  dispose?(): Promise<void> | void;
}

export interface TestCaseAdapterStartResult {
  // Provide when the adapter serves a directory or is bound to a known remote.
  // If omitted, expand() must return absolute URLs.
  baseUrl?: string;
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
  threshold: number;
  screenshotDir?: string;
}

export type PageWithEvaluate = {
  evaluate?: (fn: () => Promise<unknown>) => Promise<unknown>;
  close?: () => Promise<void>;
};
