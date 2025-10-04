import { existsSync, writeFileSync } from "fs";
import { join } from "path";

import inquirer from "inquirer";

import { initializeProject } from "../../lib";
import { type BrowserName } from "../../lib/config";
import { generateConfigContent } from "../../utils/config-generator";
import { getErrorMessage } from "../../utils/error-handler";
import log from "../../utils/logger";

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

export const initCommand = async (): Promise<void> => {
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

    log.success("\n✅ Configuration file created successfully!");
    log.info(`📄 File: ${configFileName}`);
    log.info("\n📋 Configuration summary:");
    log.info(
      `   • Config type: ${userOptions.configType === "ts" ? "TypeScript" : "JavaScript"}`
    );
    log.info(`   • Browsers: ${userOptions.browsers.join(", ")}`);
    log.info(`   • Storybook source: ${userOptions.storybookSource}`);
    log.info("\n🎉 You can now customize the configuration file as needed.");
    log.info(
      "💡 Run 'visual-testing-tool update' to capture baseline screenshots."
    );
  } catch (error) {
    log.error(`Failed to create config file: ${getErrorMessage(error)}`);
  }
};
