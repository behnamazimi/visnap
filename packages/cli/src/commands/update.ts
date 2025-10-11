import {
  updateBaselineCli,
  log,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@vividiff/core";
import { type VisualTestingToolConfig } from "@vividiff/protocol";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { ErrorHandler } from "../utils/error-handler";
import { exit } from "../utils/exit";
import { createSpinner } from "../utils/spinner";

interface UpdateCommandOptions
  extends Partial<VisualTestingToolConfig>,
    CliOptions {
  docker?: boolean;
}

const updateHandler = async (options: UpdateCommandOptions): Promise<void> => {
  const spinner = createSpinner();

  try {
    if (options.docker) {
      spinner.start("Starting Docker container...");
      const image = DEFAULT_DOCKER_IMAGE;
      const args: string[] = ["update"];
      const status = runInDocker({ image, args });
      spinner.succeed("Docker update completed");
      exit(status);
      return;
    }

    spinner.start("Discovering test cases...");
    const cliOptions: CliOptions = {
      include: options.include,
      exclude: options.exclude,
    };

    spinner.update("Capturing baseline screenshots...");
    await updateBaselineCli(options, cliOptions);

    spinner.succeed("Baseline update completed successfully! ✅");

    log.plain(
      "\n📸 Baseline screenshots have been captured and saved to the 'vividiff/base/' directory"
    );
    log.plain(
      "These will be used as reference images for future visual comparisons"
    );

    if (options.include || options.exclude) {
      log.plain(
        `\nFilters applied: ${options.include ? `include=${options.include}` : ""} ${options.exclude ? `exclude=${options.exclude}` : ""}`
      );
    }

    log.plain("\nNext steps:");
    log.plain(
      "• Run 'vividiff test' to compare current screenshots with baselines"
    );
    log.plain("• Run 'vividiff list' to see all available test cases");

    exit(0);
  } catch (error) {
    spinner.fail("Baseline update failed");
    ErrorHandler.handle(error, {
      command: "update",
      operation: "baseline capture",
      suggestion: "Check your configuration and ensure Storybook is running",
    });
    exit(1);
  }
};

export const command: Command<UpdateCommandOptions> = {
  name: "update",
  description: "Capture baseline screenshots into vividiff/base",
  handler: updateHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd
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
