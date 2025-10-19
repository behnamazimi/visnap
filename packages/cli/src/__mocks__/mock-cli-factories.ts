/**
 * @fileoverview Mock factory functions for CLI test data
 */

import type { ReporterConfig } from "../services/reporter-config-resolver";
import type { TestServiceResult } from "../services/test-service";
import type { PackageManager } from "../utils/wizard/package-manager";
import type { AdapterSelection } from "../utils/wizard/prompts";

/**
 * Creates a mock test service result
 */
export function createMockTestServiceResult(
  overrides: Partial<TestServiceResult> = {}
): TestServiceResult {
  return {
    success: true,
    exitCode: 0,
    outcome: {
      total: 5,
      passed: 5,
      failedDiffs: 0,
      failedErrors: 0,
      captureFailures: 0,
    },
    config: {
      screenshotDir: "./visnap",
      reporter: {
        html: true,
        json: true,
      },
    },
    failures: [],
    captureFailures: [],
    ...overrides,
  };
}

/**
 * Creates a mock reporter configuration
 */
export function createMockReporterConfig(
  overrides: Partial<ReporterConfig> = {}
): ReporterConfig {
  return {
    html: {
      enabled: true,
      outputPath: "./visnap/report.html",
    },
    json: {
      enabled: true,
      outputPath: "./visnap/report.json",
    },
    ...overrides,
  };
}

/**
 * Creates mock command options
 */
export function createMockCommandOptions(
  overrides: {
    include?: string | string[];
    exclude?: string | string[];
    config?: string;
    jsonReport?: string | boolean;
    htmlReport?: string | boolean;
    docker?: boolean;
  } = {}
) {
  return {
    include: undefined,
    exclude: undefined,
    config: undefined,
    jsonReport: undefined,
    htmlReport: undefined,
    docker: false,
    ...overrides,
  };
}

/**
 * Creates a mock package manager
 */
export function createMockPackageManager(
  overrides: Partial<PackageManager> = {}
): PackageManager {
  return {
    name: "npm",
    installCommand: "npm install",
    ...overrides,
  };
}

/**
 * Creates a mock adapter selection
 */
export function createMockAdapterSelection(
  overrides: Partial<AdapterSelection> = {}
): AdapterSelection {
  return {
    configType: "ts",
    browserAdapter: "playwright",
    testCaseAdapter: "storybook",
    browsers: ["chromium"],
    storybookSource: "./storybook-static",
    storybookPort: 4477,
    comparisonEngine: "odiff",
    threshold: 0.1,
    viewportPreset: "desktop",
    ...overrides,
  };
}

/**
 * Creates a mock visual testing tool config reporter section
 */
export function createMockConfigReporter(
  overrides: {
    html?: boolean | string;
    json?: boolean | string;
  } = {}
) {
  return {
    html: true,
    json: true,
    ...overrides,
  };
}

/**
 * Creates a mock error context
 */
export function createMockErrorContext(
  overrides: {
    command?: string;
    operation?: string;
    suggestion?: string;
  } = {}
) {
  return {
    command: "test",
    operation: "visual testing",
    suggestion: "Check your configuration and try again",
    ...overrides,
  };
}
