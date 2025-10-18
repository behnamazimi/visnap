import {
  runVisualTestsCli,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@visnap/core";
import type { VisualTestingToolConfig, CliOptions } from "@visnap/protocol";
import { JsonReporter, HtmlReporter } from "@visnap/reporter";

import { resolveReporterConfig } from "./reporter-config-resolver";

export interface TestServiceOptions {
  include?: string | string[];
  exclude?: string | string[];
  jsonReport?: string | boolean;
  htmlReport?: string | boolean;
  docker?: boolean;
  config?: string;
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
    const cliOptions: CliOptions & { configPath?: string } = {
      include: options.include,
      exclude: options.exclude,
      // forward explicit config path to core
      ...(options.config ? { configPath: options.config } : {}),
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
      // forward config if present
      ...(options.config ? ["--config", options.config] : []),
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
