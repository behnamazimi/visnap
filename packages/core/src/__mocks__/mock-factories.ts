/**
 * @fileoverview Mock factory functions for creating test data
 */

import type {
  VisualTestingToolConfig,
  TestCaseInstanceMeta,
  ScreenshotResult,
  BrowserName,
  Viewport,
  RunOutcome,
  TestCaseDetail,
  TestDurations,
} from "@visnap/protocol";

/**
 * Creates a mock viewport configuration
 */
export function createMockViewport(
  overrides: Partial<Viewport> = {}
): Viewport {
  return {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    ...overrides,
  };
}

/**
 * Creates a mock test case instance
 */
export function createMockTestCase(
  overrides: Partial<TestCaseInstanceMeta & { browser: BrowserName }> = {}
): TestCaseInstanceMeta & { browser: BrowserName } {
  return {
    id: "test-case-1",
    caseId: "test-case-1",
    variantId: "default",
    title: "Test Case",
    kind: "Components/Button",
    url: "http://localhost:6006/iframe.html?id=button--default",
    screenshotTarget: "story-root",
    viewport: createMockViewport(),
    browser: "chromium",
    parameters: {},
    tags: [],
    visualTesting: {},
    ...overrides,
  };
}

/**
 * Creates a mock screenshot result
 */
export function createMockScreenshotResult(
  overrides: Partial<ScreenshotResult> = {}
): ScreenshotResult {
  return {
    buffer: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), // PNG header
    meta: {
      id: "test-case-1",
      elapsedMs: 1000,
      viewportKey: "1920x1080",
    },
    ...overrides,
  };
}

/**
 * Creates a mock capture result
 */
export function createMockCaptureResult(
  overrides: Partial<{
    id: string;
    result?: ScreenshotResult;
    error?: string;
    captureDurationMs?: number;
    captureFilename?: string;
  }> = {}
) {
  return {
    id: "test-case-1",
    result: createMockScreenshotResult(),
    captureDurationMs: 1000,
    captureFilename: "test-case-1.png",
    ...overrides,
  };
}

/**
 * Creates a mock test case detail
 */
export function createMockTestCaseDetail(
  overrides: Partial<TestCaseDetail> = {}
): TestCaseDetail {
  return {
    id: "test-case-1",
    captureFilename: "test-case-1.png",
    captureDurationMs: 1000,
    comparisonDurationMs: 50,
    totalDurationMs: 1050,
    status: "passed",
    title: "Test Case",
    kind: "Components/Button",
    browser: "chromium",
    viewport: "1920x1080",
    ...overrides,
  };
}

/**
 * Creates a mock run outcome
 */
export function createMockRunOutcome(
  overrides: Partial<RunOutcome> = {}
): RunOutcome {
  return {
    passed: 5,
    total: 5,
    captureFailures: 0,
    failedDiffs: 0,
    failedMissingCurrent: 0,
    failedMissingBase: 0,
    failedErrors: 0,
    ...overrides,
  };
}

/**
 * Creates a mock test durations
 */
export function createMockTestDurations(
  overrides: Partial<TestDurations> = {}
): TestDurations {
  return {
    totalCaptureDurationMs: 5000,
    totalComparisonDurationMs: 250,
    totalDurationMs: 5250,
    ...overrides,
  };
}

/**
 * Creates a mock visual testing tool configuration
 */
export function createMockConfig(
  overrides: Partial<VisualTestingToolConfig> = {}
): VisualTestingToolConfig {
  return {
    screenshotDir: "visnap",
    adapters: {
      browser: { name: "chromium" },
      testCase: [{ name: "storybook" }],
    },
    comparison: {
      core: "odiff",
      threshold: 0.1,
      diffColor: "#00ff00",
    },
    viewport: createMockViewport() as any,
    runtime: {
      maxConcurrency: 6,
    },
    ...overrides,
  };
}

/**
 * Creates a mock CLI options object
 */
export function createMockCliOptions(
  overrides: {
    include?: string | string[];
    exclude?: string | string[];
    configPath?: string;
  } = {}
) {
  return {
    include: undefined,
    exclude: undefined,
    configPath: undefined,
    ...overrides,
  };
}

/**
 * Creates a mock comparison result
 */
export function createMockComparisonResult(
  overrides: {
    id: string;
    match: boolean;
    reason?: string;
    diffPercentage?: number;
  } = { id: "test-case-1", match: true }
) {
  return {
    id: overrides.id,
    match: overrides.match,
    reason: overrides.match ? "" : overrides.reason || "pixel-diff",
    diffPercentage: overrides.match ? 0 : overrides.diffPercentage || 0,
  };
}
