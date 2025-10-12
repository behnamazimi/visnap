import {
  runVisualTestsCli,
  log,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@vividiff/core";
import type { VisualTestingToolConfig } from "@vividiff/protocol";
import { JsonReporter, HtmlReporter } from "@vividiff/reporter";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { ErrorHandler } from "../utils/error-handler";
import { exit } from "../utils/exit";
import {
  formatTestSummary,
  formatNextSteps,
  type TestSummary,
} from "../utils/formatter";
import { createSpinner, shouldUseSpinner } from "../utils/spinner";

interface TestCommandOptions extends CliOptions {
  jsonReport?: string | boolean; // when provided without a path => stdout JSON; when a path => write file
  htmlReport?: string | boolean; // when provided without a path => write to screenshotDir; when a path => write to specified location
  docker?: boolean;
}

function resolveReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliHtmlReport?: string | boolean,
  cliJsonReport?: string | boolean,
  screenshotDir: string = "./vividiff"
) {
  // Determine HTML report configuration
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

  // Determine JSON report configuration
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

  return {
    html: { enabled: htmlEnabled, outputPath: htmlPath },
    json: { enabled: jsonEnabled, outputPath: jsonPath },
  };
}

const testHandler = async (options: TestCommandOptions): Promise<void> => {
  const useSpinner = shouldUseSpinner();
  const spinner = useSpinner ? createSpinner() : null;

  try {
    if (options.docker) {
      if (useSpinner) {
        spinner!.start("Starting Docker container...");
      } else {
        log.info("Starting Docker container...");
      }
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
      const status = runInDocker({ image, args });
      if (useSpinner) {
        spinner!.succeed("Docker test completed");
      } else {
        log.success("Docker test completed");
      }
      exit(status);
      return;
    }

    if (useSpinner) {
      spinner!.start("Discovering test cases...");
    } else {
      log.info("Discovering test cases...");
    }
    const cliOptions: CliOptions = {
      include: options.include,
      exclude: options.exclude,
    };

    if (useSpinner) {
      spinner!.update("Running visual tests...");
    } else {
      log.info("Running visual tests...");
    }
    const result = await runVisualTestsCli({}, cliOptions);
    if (useSpinner) {
      spinner!.succeed("Visual tests completed");
    }

    // Resolve reporter configuration
    const reporterConfig = resolveReporterConfig(
      result.config?.reporter,
      options.htmlReport,
      options.jsonReport,
      result.config?.screenshotDir || "./vividiff"
    );

    // Generate JSON report if enabled
    if (reporterConfig.json.enabled) {
      if (useSpinner) {
        spinner!.update("Generating JSON report...");
      } else {
        log.info("Generating JSON report...");
      }

      const reporter = new JsonReporter();
      const reportPath = await reporter.generate(result, {
        outputPath: reporterConfig.json.outputPath,
        screenshotDir: result.config?.screenshotDir || "./vividiff",
        pretty: true,
      });

      if (useSpinner) {
        spinner!.succeed(`JSON report written to: ${reportPath}`);
      } else {
        log.success(`JSON report written to: ${reportPath}`);
      }
    }

    // Generate HTML report if enabled
    if (reporterConfig.html.enabled) {
      if (useSpinner) {
        spinner!.update("Generating HTML report...");
      } else {
        log.info("Generating HTML report...");
      }

      const reporter = new HtmlReporter();
      const reportPath = await reporter.generate(result, {
        outputPath: reporterConfig.html.outputPath,
        screenshotDir: result.config?.screenshotDir || "./vividiff",
        title: "Vividiff Test Report",
      });

      if (useSpinner) {
        spinner!.succeed(`HTML report generated: ${reportPath}`);
      } else {
        log.success(`HTML report generated: ${reportPath}`);
      }
    }

    if (!reporterConfig.json.enabled && !reporterConfig.html.enabled) {
      if (useSpinner) {
        spinner!.stop();
      }

      // Display summary
      const summary: TestSummary = {
        total: result.outcome.total || 0,
        passed: result.outcome.passed || 0,
        failed: result.outcome.failedDiffs || 0,
        errors:
          (result.outcome.failedErrors || 0) +
          (result.outcome.captureFailures || 0),
        captureFailures: result.outcome.captureFailures || 0,
      };

      formatTestSummary(summary);
      formatNextSteps(summary);

      if (!result.success) {
        log.error("Some tests failed");
      }
    }

    exit(result.exitCode);
  } catch (error) {
    if (useSpinner) {
      spinner!.fail("Test execution failed");
    } else {
      log.error("Test execution failed");
    }
    ErrorHandler.handle(error, {
      command: "test",
      operation: "visual testing",
      suggestion: "Check your configuration and ensure Storybook is running",
    });
    exit(1);
  }
};

export const command: Command<TestCommandOptions> = {
  name: "test",
  description: "Capture current screenshots and compare with baseline",
  handler: testHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd
      .option(
        "--jsonReport [value]",
        "Generate JSON report. Use --jsonReport=false to disable, --jsonReport or --jsonReport=path for custom location"
      )
      .option(
        "--htmlReport [value]",
        "Generate HTML report. Use --htmlReport=false to disable, --htmlReport or --htmlReport=path for custom location"
      )
      .option("--docker", "Run inside Docker")
      .option(
        "--include <pattern>",
        "Include test cases matching pattern (can be used multiple times)"
      )
      .option(
        "--exclude <pattern>",
        "Exclude test cases matching pattern (can be used multiple times)"
      );
  },
};
