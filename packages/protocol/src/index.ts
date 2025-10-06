export type BrowserName = "chromium" | "firefox" | "webkit" | (string & {});

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
}

export type ViewportMap = Record<string, Viewport>;

export interface ScreenshotOptions {
  url: string;
  selector?: string;
  viewport?: Viewport;
  waitFor?: string | number;
}

export interface ScreenshotResult {
  buffer: Uint8Array;
  meta: { elapsedMs: number; viewportKey?: string };
}

export interface TestCaseMeta {
  id: string;
  title: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
}

export interface TestCaseInstance {
  caseId: string;
  variantId: string;
  source: string; // absolute or relative; if relative, core will prefix adapter.start().baseUrl
  selector?: string;
}

export interface BrowserAdapterInitOptions {
  browser: BrowserName;
  viewport?: ViewportMap;
}

export interface BrowserAdapter {
  name: string;
  init?(opts: BrowserAdapterInitOptions): Promise<void> | void;
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
  listCases(): Promise<TestCaseMeta[]>;
  // If start() provided baseUrl, urls may be relative; otherwise, urls must be absolute.
  expand(caseId: string, opts?: { viewport?: ViewportMap }): Promise<TestCaseInstance[]>;
  stop?(): Promise<void>;
}