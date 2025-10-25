/**
 * @fileoverview Init command implementation
 *
 * Implements the 'init' command for initializing new Visnap projects.
 * Provides both interactive wizard and quick setup modes for configuration
 * file generation.
 */

import { existsSync, writeFileSync } from "fs";
import { join } from "path";

import { initializeProject, generateConfigContent, log } from "@visnap/core";
import inquirerImport from "inquirer";

// Handle both ESM and CommonJS inquirer imports
const inquirer = (inquirerImport as any).default || inquirerImport;

import { type Command } from "../types";
import {
  runConfigWizard,
  generateConfigFromSelection,
} from "../utils/config-wizard";
import { ErrorHandler } from "../utils/error-handler";
import { addVisualTestScriptsToProject } from "../utils/package-script-manager";

/**
 * Options for the init command.
 */
interface InitOptions {
  /** Configuration file type (TypeScript or JavaScript) */
  configType?: "ts" | "js";
  /** Whether to use interactive wizard mode */
  wizard?: boolean;
}

/**
 * Prompts the user for initialization options.
 * @returns Promise resolving to user-selected options.
 */
const promptUser = async (): Promise<InitOptions> => {
  console.clear();
  log.info("🚀 Welcome to Visual Testing Tool setup!");
  log.info("This will create a configuration file for your project.\n");

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "setupType",
      message: "Choose setup method:",
      choices: [
        { name: "Interactive wizard (recommended)", value: "wizard" },
        { name: "Quick setup with defaults", value: "quick" },
      ],
      default: "wizard",
    },
    {
      type: "list",
      name: "configType",
      message: "Choose configuration file type:",
      choices: [
        { name: "TypeScript (visnap.config.ts)", value: "ts" },
        { name: "JavaScript (visnap.config.js)", value: "js" },
      ],
      default: "ts",
      when: (answers: any) => answers.setupType === "quick",
    },
  ]);

  return {
    configType: answers.configType || "ts",
    wizard: answers.setupType === "wizard",
  };
};

/**
 * Handler for the init command.
 * @param _options - Unused options parameter.
 * @returns Promise that resolves when initialization completes.
 */
const initHandler = async (_options: void): Promise<void> => {
  try {
    const currentDir = process.cwd();
    const userOptions = await promptUser();

    let configContent: string;
    let configType: string;

    if (userOptions.wizard) {
      // Use interactive wizard
      const selection = await runConfigWizard();
      configContent = generateConfigFromSelection(selection);
      configType = selection.configType;
    } else {
      // Use the API to generate the config content
      const result = await initializeProject({
        configType: userOptions.configType!,
      });

      if (!result.success) {
        log.error("Failed to initialize project");
        return;
      }

      // Write the config file
      configContent = generateConfigContent({
        configType: userOptions.configType!,
      });
      configType = userOptions.configType!;
    }

    const configFileName = `visnap.config.${configType}`;
    const newConfigPath = join(currentDir, configFileName);

    if (existsSync(newConfigPath)) {
      log.error(`${configFileName} already exists in the current directory.`);
      log.warn("Remove the existing file or choose a different directory.");
      return;
    }

    writeFileSync(newConfigPath, configContent);

    log.success("Configuration file created successfully!");
    log.plain(`📄 File: ${configFileName}`);
    log.plain("\n📋 Configuration summary:");
    log.plain(
      `   • Config type: ${configType === "ts" ? "TypeScript" : "JavaScript"}`
    );
    if (userOptions.wizard) {
      log.plain("   • Interactive wizard configuration applied");
    }

    // Add visual testing scripts to package.json
    const scriptResult = addVisualTestScriptsToProject();

    if (scriptResult.success && scriptResult.added.length > 0) {
      log.success(`Added ${scriptResult.added.length} visual testing script(s) to package.json`);
    }

    log.plain("\n🎉 You can now customize the configuration file as needed.");
    log.plain("\nNext steps:");
    log.plain("  1. Run 'visnap validate' to check your configuration");
    log.plain("  2. Run 'visnap update' to create baseline screenshots");
    log.plain("  3. Run 'visnap test' to run visual tests");
    log.plain("\n💡 You can also use npm scripts:");
    log.plain("   • npm run visnap:test - Run visual tests");
    log.plain("   • npm run visnap:update - Update baseline screenshots");
    log.plain("   • npm run visnap:open - Open test results");
  } catch (error) {
    ErrorHandler.handle(error, {
      command: "init",
      operation: "project initialization",
      suggestion: "Check your permissions and try again",
    });
  }
};

export const command: Command<void> = {
  name: "init",
  description: "Initialize a new ViSnap project with sample config",
  handler: initHandler,
};
