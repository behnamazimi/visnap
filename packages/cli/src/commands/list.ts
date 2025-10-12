import { listTestCasesCli, log } from "@vividiff/core";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { ErrorHandler } from "../utils/error-handler";
import { formatTestCases } from "../utils/formatter";
import { createSpinner, shouldUseSpinner } from "../utils/spinner";

interface ListOptions extends CliOptions {
  config?: string;
}

const listHandler = async (options: ListOptions): Promise<void> => {
  const useSpinner = shouldUseSpinner();
  const spinner = useSpinner ? createSpinner() : null;

  try {
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
      spinner!.update("Loading configuration and adapters...");
    } else {
      log.info("Loading configuration and adapters...");
    }
    const result = await listTestCasesCli({}, cliOptions);

    if (useSpinner) {
      spinner!.succeed(`Found ${result.testCases.length} test cases`);
    } else {
      log.success(`Found ${result.testCases.length} test cases`);
    }

    // Format and display results
    const formattedTestCases = result.testCases.map(testCase => ({
      id: testCase.caseId || "unknown",
      title: testCase.title || "Untitled",
      kind: testCase.kind || "Unknown", // kind might be specific to certain adapters
      browser: testCase.browser,
    }));

    formatTestCases(formattedTestCases);

    // Show summary
    log.plain(`\n📊 Summary:`);
    log.plain(`• Total test cases: ${result.summary.total}`);

    if (result.summary.browsers.length > 0) {
      log.plain(`• Browsers: ${result.summary.browsers.join(", ")}`);
    }

    if (result.summary.viewports.length > 0) {
      log.plain(`• Viewports: ${result.summary.viewports.join(", ")}`);
    }

    if (options.include || options.exclude) {
      log.plain(
        `• Filters applied: ${options.include ? `include=${options.include}` : ""} ${options.exclude ? `exclude=${options.exclude}` : ""}`
      );
    }
  } catch (error) {
    if (useSpinner) {
      spinner!.fail("Failed to discover test cases");
    } else {
      log.error("Failed to discover test cases");
    }
    ErrorHandler.handle(error, {
      command: "list",
      operation: "test case discovery",
      suggestion: "Check your configuration and ensure Storybook is accessible",
    });
  }
};

export const command: Command<ListOptions> = {
  name: "list",
  description: "List all discovered test cases without running tests",
  handler: listHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd
      .option("--config <path>", "Path to configuration file")
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
