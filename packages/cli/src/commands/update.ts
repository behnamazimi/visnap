import {
  updateBaselineCli,
  log,
  getErrorMessage,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@vividiff/core";
import { type VisualTestingToolConfig } from "@vividiff/protocol";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { exit } from "../utils/exit";

interface UpdateCommandOptions
  extends Partial<VisualTestingToolConfig>,
    CliOptions {
  docker?: boolean;
}

const updateHandler = async (options: UpdateCommandOptions): Promise<void> => {
  try {
    if (options.docker) {
      const image = DEFAULT_DOCKER_IMAGE;
      const args: string[] = ["update"];
      const status = runInDocker({ image, args });
      exit(status);
      return;
    }
    const cliOptions: CliOptions = {
      include: options.include,
      exclude: options.exclude,
    };
    await updateBaselineCli(options, cliOptions);

    // TODO: Add more detailed result log in mature versions
    log.success(`Update baseline completed`);
    exit(0);
  } catch (error) {
    log.error(`Error updating baseline: ${getErrorMessage(error)}`);
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
