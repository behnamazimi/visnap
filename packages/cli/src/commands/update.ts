import {
  updateBaseline,
  log,
  getErrorMessage,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@visual-testing-tool/core";
import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { exit } from "../utils/exit";

interface UpdateCommandOptions extends Partial<VisualTestingToolConfig> {
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
    await updateBaseline(options);

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
  description: "Capture baseline screenshots into visual-testing-tool/base",
  handler: updateHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd.option("--docker", "Run inside Docker");
    // Options will be added in mature versions
  },
};
