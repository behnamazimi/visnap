import {
  runVisualTests,
  getErrorMessage,
  log,
} from "@visual-testing-tool/core";
import { type Command as CommanderCommand } from "commander";
import { writeFileSync } from "fs";

import { type Command } from "../types";

interface TestCommandOptions {
  report?: string; // when provided without a path => stdout JSON; when a path => write file
}

const testHandler = async (options: TestCommandOptions): Promise<void> => {
  try {
    const result = await runVisualTests({});

    if (options.report) {
      const report = {
        success: result.success,
        outcome: result.outcome,
        timestamp: new Date().toISOString(),
      };
      const reportJson = JSON.stringify(report, null, 2);

      // If report looks like a filename/path (has a slash or ends with .json), write to file; else print
      const val = options.report.trim();
      const looksLikePath = /[\\/]|\.json$/i.test(val);
      if (looksLikePath) {
        writeFileSync(val, reportJson);
        log.info(`Report written to: ${val}`);
      } else {
        console.log(reportJson);
      }
    }

    if (!options.report) {
      if (result.success) {
        log.success(`Test run completed successfully`);
      } else {
        log.error(`Test run failed`);
      }
    }

    process.exitCode = result.exitCode;
  } catch (error) {
    log.error(`Error running tests: ${getErrorMessage(error)}`);
    process.exitCode = 1;
  }
};

export const command: Command = {
  name: "test",
  description: "Capture current screenshots and compare with baseline",
  handler: testHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd.option(
      "--report [path]",
      "Output JSON report. Provide a path to write to file; omit to print to stdout"
    );
  },
};
