import {
  runVisualTests,
  getErrorMessage,
  log,
} from "@visual-testing-tool/core";
import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";

const testHandler = async (options: VisualTestingToolConfig): Promise<void> => {
  try {
    await runVisualTests(options); // Options will be passed in mature versions

    // TODO: Add more detailed result log in mature versions
    log.success(`Test run completed`);
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
    return cmd;
    // Opttions will be added in mature versions
  },
};
