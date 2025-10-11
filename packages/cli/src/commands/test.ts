import { writeFileSync } from "fs";

import {
  runVisualTestsCli,
  log,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@vividiff/core";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { ErrorHandler } from "../utils/error-handler";
import { exit } from "../utils/exit";
import {
  formatTestResults,
  formatTestSummary,
  formatNextSteps,
  type TestResult,
  type TestSummary,
} from "../utils/formatter";
import { createSpinner } from "../utils/spinner";

interface TestCommandOptions extends CliOptions {
  jsonReport?: string | boolean; // when provided without a path => stdout JSON; when a path => write file
  docker?: boolean;
}

const testHandler = async (options: TestCommandOptions): Promise<void> => {
  const spinner = createSpinner();

  try {
    if (options.docker) {
      spinner.start("Starting Docker container...");
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
      ];
      const status = runInDocker({ image, args });
      spinner.succeed("Docker test completed");
      exit(status);
      return;
    }

    spinner.start("Discovering test cases...\n");
    const cliOptions: CliOptions = {
      include: options.include,
      exclude: options.exclude,
    };

    spinner.update("Running visual tests...\n");
    const result = await runVisualTestsCli({}, cliOptions);

    if (options.jsonReport) {
      spinner.update("Generating JSON report...\n");
      const report = {
        success: result.success,
        outcome: result.outcome,
        failures: result.failures,
        captureFailures: result.captureFailures,
        timestamp: new Date().toISOString(),
      };
      const reportJson = JSON.stringify(report, null, 2);

      // If jsonReport looks like a filename/path (has a slash or ends with .json), write to file; else print
      const val =
        typeof options.jsonReport === "string" ? options.jsonReport.trim() : "";
      const looksLikePath = val ? /[\\/]|\.json$/i.test(val) : false;
      if (looksLikePath) {
        writeFileSync(val, reportJson);
        spinner.succeed(`JSON report written to: ${val}`);
      } else {
        spinner.stop();
        console.log(reportJson);
      }
    } else {
      // Format and display results
      const testResults: TestResult[] = [];

      // Add passed tests
      for (let i = 0; i < (result.outcome.passed || 0); i++) {
        testResults.push({
          id: `test-${i + 1}`,
          status: "passed",
        });
      }

      // Add failed tests
      if (result.failures) {
        for (const failure of result.failures) {
          testResults.push({
            id: failure.id,
            status: "failed",
            reason: failure.reason,
            diffPercentage: failure.diffPercentage,
          });
        }
      }

      // Add capture failures
      if (result.captureFailures) {
        for (const failure of result.captureFailures) {
          testResults.push({
            id: failure.id,
            status: "error",
            error: failure.error,
          });
        }
      }

      spinner.stop();

      // Display results
      if (testResults.length > 0) {
        formatTestResults(testResults);
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

      if (result.success) {
        log.success("All tests passed! 🎉");
      } else {
        log.error("Some tests failed");
      }
    }

    exit(result.exitCode);
  } catch (error) {
    spinner.fail("Test execution failed");
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
        "--jsonReport [path]",
        "Output JSON report. Provide a path to write to file; omit to print to stdout"
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
