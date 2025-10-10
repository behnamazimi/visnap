import { writeFileSync } from "fs";

import {
  runVisualTestsCli,
  getErrorMessage,
  log,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@vividiff/core";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { exit } from "../utils/exit";

interface TestCommandOptions extends CliOptions {
  jsonReport?: string | boolean; // when provided without a path => stdout JSON; when a path => write file
  docker?: boolean;
}

const testHandler = async (options: TestCommandOptions): Promise<void> => {
  try {
    if (options.docker) {
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
      exit(status);
      return;
    }
    const cliOptions: CliOptions = {
      include: options.include,
      exclude: options.exclude,
    };
    const result = await runVisualTestsCli({}, cliOptions);

    if (options.jsonReport) {
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
        log.info(`JSON report written to: ${val}`);
      } else {
        console.log(reportJson);
      }
    }

    if (!options.jsonReport) {
      if (result.success) {
        log.success(`Test run completed successfully`);
      } else {
        log.error(`Test run failed`);
      }
    }

    exit(result.exitCode);
  } catch (error) {
    log.error(`Error running tests: ${getErrorMessage(error)}`);
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
