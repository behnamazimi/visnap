import { updateBaseline, log } from "@visual-testing-tool/core";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";

const updateHandler = async (options: {
  include?: string;
  exclude?: string;
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
    const result = await updateBaseline({
      include,
      exclude,
      dryRun: options.dryRun,
      useDocker,
    });

    if (result.success) {
      log.success(
        `Successfully updated baseline for ${result.browsers.join(", ")}`
      );
      log.info(`Total test cases updated: ${result.totalTestCases}`);
    } else {
      log.error("Failed to update baseline");
      process.exitCode = 1;
    }
  } catch (error) {
    log.error(
      `Error updating baseline: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exitCode = 1;
  }
};

export const command: Command = {
  name: "update",
  description: "Capture baseline screenshots into visual-testing-tool/base",
  handler: updateHandler,
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
      .option("--docker", "Run the command inside the VTT Docker image")
      .option(
        "--dry-run",
        "List matched test cases without taking screenshots"
      );
  },
};
