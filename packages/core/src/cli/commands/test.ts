import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";

import { runTests } from "@/lib";
import { getErrorMessage } from "@/utils/error-handler";
import log from "@/utils/logger";

const testHandler = async (options: {
  include?: string;
  exclude?: string;
  json?: string | boolean;
  dryRun?: boolean;
  docker?: boolean;
}): Promise<void> => {
  const useDocker = options.docker ?? false;
  const include = options.include
    ? options.include
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;
  const exclude = options.exclude
    ? options.exclude
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;

  try {
    const result = await runTests({
      include,
      exclude,
      dryRun: options.dryRun,
      jsonReport: options.json,
      useDocker,
    });

    // Log results
    for (const browserResult of result.browserResults) {
      log.info(
        `[${browserResult.browser}] ${browserResult.passed} out of ${browserResult.total} tests passed`
      );
    }

    if (result.passed) {
      log.success("All test cases are matching");
    } else {
      log.error("Some test cases are not matching");
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
    return cmd
      .option(
        "--include <patterns>",
        "Comma-separated list of minimatch patterns for test case ids/titles to include"
      )
      .option(
        "--exclude <patterns>",
        "Comma-separated list of minimatch patterns for test case ids/titles to exclude"
      )
      .option(
        "--json [path]",
        "Write JSON report (defaults to visual-testing-tool-report.json)"
      )
      .option("--docker", "Run the command inside the VTT Docker image")
      .option("--dry-run", "List matched stories without taking screenshots");
  },
};
