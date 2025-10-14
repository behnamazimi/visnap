import {
  runVisualTestsCli,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@visnap/core";
import type { VisualTestingToolConfig } from "@visnap/protocol";
import { JsonReporter, HtmlReporter } from "@visnap/reporter";

import { type CliOptions } from "../types/cli-options";

export interface TestServiceOptions {
  include?: string | string[];
  exclude?: string | string[];
  jsonReport?: string | boolean;
  htmlReport?: string | boolean;
  docker?: boolean;
}

export interface TestServiceResult {
  success: boolean;
  exitCode: number;
  outcome: {
    total?: number;
    passed?: number;
    failedDiffs?: number;
    failedErrors?: number;
    captureFailures?: number;
  };
  config?: {
    screenshotDir?: string;
    reporter?: VisualTestingToolConfig["reporter"];
  };
  failures?: Array<{
    id: string;
    reason: string;
    diffPercentage?: number;
  }>;
  captureFailures?: Array<{
    id: string;
    error: string;
  }>;
}

export interface ReporterConfig {
  html: {
    enabled: boolean;
    outputPath?: string;
  };
  json: {
    enabled: boolean;
    outputPath?: string;
  };
}

/**
 * Resolves HTML reporter configuration from CLI and config options
 */
export function resolveHtmlReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliHtmlReport?: string | boolean,
  screenshotDir: string = "./visnap"
): { enabled: boolean; outputPath?: string } {
  let htmlEnabled = true; // default
  let htmlPath: string | undefined;

  // CLI overrides take precedence
  if (cliHtmlReport !== undefined) {
    if (cliHtmlReport === false || cliHtmlReport === "false") {
      htmlEnabled = false;
    } else if (typeof cliHtmlReport === "string") {
      htmlEnabled = true;
      htmlPath = cliHtmlReport;
    } else if (cliHtmlReport === true || cliHtmlReport === "true") {
      htmlEnabled = true;
    }
  } else {
    // Apply config values only if CLI doesn't override
    if (configReporter?.html !== undefined) {
      if (typeof configReporter.html === "boolean") {
        htmlEnabled = configReporter.html;
      } else if (typeof configReporter.html === "string") {
        htmlEnabled = true;
        htmlPath = configReporter.html;
      }
    }
  }

  // Set default path if enabled but no path specified
  if (htmlEnabled && !htmlPath) {
    htmlPath = `${screenshotDir}/report.html`;
  }

  return { enabled: htmlEnabled, outputPath: htmlPath };
}

/**
 * Resolves JSON reporter configuration from CLI and config options
 */
export function resolveJsonReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliJsonReport?: string | boolean,
  screenshotDir: string = "./visnap"
): { enabled: boolean; outputPath?: string } {
  let jsonEnabled = true; // default
  let jsonPath: string | undefined;

  // CLI overrides take precedence
  if (cliJsonReport !== undefined) {
    if (cliJsonReport === false || cliJsonReport === "false") {
      jsonEnabled = false;
    } else if (typeof cliJsonReport === "string") {
      jsonEnabled = true;
      jsonPath = cliJsonReport;
    } else if (cliJsonReport === true || cliJsonReport === "true") {
      jsonEnabled = true;
    }
  } else {
    // Apply config values only if CLI doesn't override
    if (configReporter?.json !== undefined) {
      if (typeof configReporter.json === "boolean") {
        jsonEnabled = configReporter.json;
      } else if (typeof configReporter.json === "string") {
        jsonEnabled = true;
        jsonPath = configReporter.json;
      }
    }
  }

  // Set default path if enabled but no path specified
  if (jsonEnabled && !jsonPath) {
    jsonPath = `${screenshotDir}/report.json`;
  }

  return { enabled: jsonEnabled, outputPath: jsonPath };
}

/**
 * Resolves complete reporter configuration from CLI and config options
 */
export function resolveReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliHtmlReport?: string | boolean,
  cliJsonReport?: string | boolean,
  screenshotDir: string = "./visnap"
): ReporterConfig {
  return {
    html: resolveHtmlReporterConfig(
      configReporter,
      cliHtmlReport,
      screenshotDir
    ),
    json: resolveJsonReporterConfig(
      configReporter,
      cliJsonReport,
      screenshotDir
    ),
  };
}

/**
 * Service for handling test execution business logic
 */
export class TestService {
  /**
   * Execute tests with the given options
   */
  async executeTests(options: TestServiceOptions): Promise<TestServiceResult> {
    if (options.docker) {
      return this.executeTestsInDocker(options);
    }

    return this.executeTestsLocally(options);
  }

  /**
   * Execute tests locally
   */
  private async executeTestsLocally(
    options: TestServiceOptions
  ): Promise<TestServiceResult> {
    const cliOptions: CliOptions = {
      include: options.include,
      exclude: options.exclude,
    };

    const result = await runVisualTestsCli({}, cliOptions);

    // Resolve reporter configuration
    const reporterConfig = resolveReporterConfig(
      result.config?.reporter,
      options.htmlReport,
      options.jsonReport,
      result.config?.screenshotDir || "./visnap"
    );

    // Generate reports if enabled
    if (reporterConfig.json.enabled) {
      const reporter = new JsonReporter();
      await reporter.generate(result, {
        outputPath: reporterConfig.json.outputPath,
        screenshotDir: result.config?.screenshotDir || "./visnap",
        pretty: true,
      });
    }

    if (reporterConfig.html.enabled) {
      const reporter = new HtmlReporter();
      await reporter.generate(result, {
        outputPath: reporterConfig.html.outputPath,
        screenshotDir: result.config?.screenshotDir || "./visnap",
        title: "VISNAP Test Report",
      });
    }

    return result;
  }

  /**
   * Execute tests in Docker
   */
  private async executeTestsInDocker(
    options: TestServiceOptions
  ): Promise<TestServiceResult> {
    const image = DEFAULT_DOCKER_IMAGE;
    const args: string[] = [
      "test",
      // Forward jsonReport flag if present
      ...(options.jsonReport
        ? [
            "--jsonReport",
            ...(typeof options.jsonReport === "string"
              ? [options.jsonReport]
              : []),
          ]
        : []),
      // Forward htmlReport flag if present
      ...(options.htmlReport
        ? [
            "--htmlReport",
            ...(typeof options.htmlReport === "string"
              ? [options.htmlReport]
              : []),
          ]
        : []),
    ];

    const status = await runInDocker({ image, args });

    return {
      success: status === 0,
      exitCode: status,
      outcome: {
        total: 0,
        passed: 0,
        failedDiffs: 0,
        failedErrors: 0,
        captureFailures: 0,
      },
    };
  }
}
