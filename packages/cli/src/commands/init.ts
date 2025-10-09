import { existsSync, writeFileSync } from "fs";
import { join } from "path";

import {
  initializeProject,
  generateConfigContent,
  getErrorMessage,
  log,
} from "@vividiff/core";
import inquirer from "inquirer";

import { type Command } from "../types";

interface InitOptions {
  configType: "ts" | "js";
}

const promptUser = async (): Promise<InitOptions> => {
  console.clear();
  log.info("🚀 Welcome to Visual Testing Tool setup!");
  log.info("This will create a configuration file for your project.\n");

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "configType",
      message: "Choose configuration file type:",
      choices: [
        { name: "TypeScript (vtt.config.ts)", value: "ts" },
        { name: "JavaScript (vtt.config.js)", value: "js" },
      ],
      default: "ts",
    },
  ]);

  return {
    configType: answers.configType,
  };
};

const initHandler = async (_options: void): Promise<void> => {
  try {
    const currentDir = process.cwd();
    const userOptions = await promptUser();

    const configFileName = `vtt.config.${userOptions.configType}`;
    const newConfigPath = join(currentDir, configFileName);

    if (existsSync(newConfigPath)) {
      log.error(`${configFileName} already exists in the current directory.`);
      log.warn("Remove the existing file or choose a different directory.");
      return;
    }

    // Use the API to generate the config content
    const result = await initializeProject({
      configType: userOptions.configType,
    });

    if (!result.success) {
      log.error("Failed to initialize project");
      return;
    }

    // Write the config file
    const configContent = generateConfigContent(userOptions);
    writeFileSync(newConfigPath, configContent);

    log.success("Configuration file created successfully!");
    log.plain(`📄 File: ${configFileName}`);
    log.plain("\n📋 Configuration summary:");
    log.plain(
      `   • Config type: ${userOptions.configType === "ts" ? "TypeScript" : "JavaScript"}`
    );
    log.plain("\n🎉 You can now customize the configuration file as needed.");
  } catch (error) {
    log.error(`Failed to create config file: ${getErrorMessage(error)}`);
  }
};

export const command: Command<void> = {
  name: "init",
  description: "Initialize a new VTT project with sample config",
  handler: initHandler,
};
