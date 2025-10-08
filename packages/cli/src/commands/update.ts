import {
  updateBaseline,
  log,
  getErrorMessage,
} from "@visual-testing-tool/core";
import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";

const updateHandler = async (
  options: VisualTestingToolConfig
): Promise<void> => {
  try {
    await updateBaseline(options);

    // TODO: Add more detailed result log in mature versions
    log.success(`Update baseline completed`);
    process.exit(0);
  } catch (error) {
    log.error(`Error updating baseline: ${getErrorMessage(error)}`);
    process.exit(1);
  }
};

export const command: Command<VisualTestingToolConfig> = {
  name: "update",
  description: "Capture baseline screenshots into visual-testing-tool/base",
  handler: updateHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd;
    // Options will be added in mature versions
  },
};
