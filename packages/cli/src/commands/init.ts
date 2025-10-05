import { existsSync, writeFileSync } from "fs";
import { join } from "path";

import {
  initializeProject,
  type BrowserName,
  generateConfigContent,
  getErrorMessage,
  log,
} from "@visual-testing-tool/core";
import inquirer from "inquirer";

import { type Command } from "../types";

interface InitOptions {
  configType: "ts" | "js";
  browsers: BrowserName[];
  storybookSource: string;
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
    {
      type: "checkbox",
      name: "browsers",
      message:
        "Select browsers to test (use space to select, enter to confirm):",
      choices: [
        { name: "Chromium", value: "chromium", checked: true },
        { name: "Firefox", value: "firefox" },
        { name: "WebKit", value: "webkit" },
      ],
      validate: input => {
        if (input.length === 0) {
          return "Please select at least one browser.";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "storybookSource",
      message: "Enter storybook source path:",
      default: "./storybook-static",
      validate: input => {
        if (!input.trim()) {
          return "Please enter a valid path.";
        }
        return true;
      },
    },
  ]);

  return {
    configType: answers.configType,
    browsers: answers.browsers,
    storybookSource: answers.storybookSource,
  };
};

const initHandler = async (): Promise<void> => {
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
      browsers: userOptions.browsers,
      storybookSource: userOptions.storybookSource,
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
    log.plain(`   • Browsers: ${userOptions.browsers.join(", ")}`);
    log.plain(`   • Storybook source: ${userOptions.storybookSource}`);
    log.plain("\n🎉 You can now customize the configuration file as needed.");
    log.plain(
      "💡 Run 'visual-testing-tool update' to capture baseline screenshots."
    );
  } catch (error) {
    log.error(`Failed to create config file: ${getErrorMessage(error)}`);
  }
};

export const command: Command = {
  name: "init",
  description: "Initialize a new VTT project with sample config",
  handler: initHandler,
};
