import { existsSync } from "fs";

import { loadConfigFile, log } from "@vividiff/core";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { ErrorHandler } from "../utils/error-handler";
import { createSpinner, shouldUseSpinner } from "../utils/spinner";

interface ValidateOptions {
  config?: string;
}

const validateHandler = async (options: ValidateOptions): Promise<void> => {
  const useSpinner = shouldUseSpinner();
  const spinner = useSpinner ? createSpinner() : null;

  try {
    if (useSpinner) {
      spinner!.start("Validating configuration...");
    } else {
      log.info("Validating configuration...");
    }

    // Check if config file exists
    const configPath = options.config || "vividiff.config.ts";
    if (!existsSync(configPath) && !existsSync("vividiff.config.js")) {
      if (useSpinner) {
        spinner!.fail("Configuration file not found");
      } else {
        log.error("Configuration file not found");
      }
      log.error(`No configuration file found at ${configPath}`);
      log.plain("Run 'vividiff init' to create a configuration file");
      return;
    }

    if (useSpinner) {
      spinner!.update("Loading configuration...");
    } else {
      log.info("Loading configuration...");
    }

    // Load and validate config
    const config = await loadConfigFile();

    if (!config) {
      if (useSpinner) {
        spinner!.fail("Failed to load configuration");
      } else {
        log.error("Failed to load configuration");
      }
      log.error("Configuration file is invalid or empty");
      return;
    }

    if (useSpinner) {
      spinner!.update("Validating adapters...");
    } else {
      log.info("Validating adapters...");
    }

    // Validate browser adapter
    if (config.adapters?.browser?.name) {
      const browserAdapter = config.adapters.browser.name;
      try {
        await import(browserAdapter);
        log.success(`✓ Browser adapter '${browserAdapter}' is available`);
      } catch {
        log.error(`✗ Browser adapter '${browserAdapter}' not found`);
        log.plain(`Install it with: npm install ${browserAdapter}`);
        return;
      }
    } else {
      log.warn("No browser adapter configured");
    }

    // Validate test case adapters
    if (config.adapters?.testCase && config.adapters.testCase.length > 0) {
      for (const testCaseAdapter of config.adapters.testCase) {
        try {
          await import(testCaseAdapter.name);
          log.success(
            `✓ Test case adapter '${testCaseAdapter.name}' is available`
          );
        } catch {
          log.error(`✗ Test case adapter '${testCaseAdapter.name}' not found`);
          log.plain(`Install it with: npm install ${testCaseAdapter.name}`);
          return;
        }
      }
    } else {
      log.warn("No test case adapters configured");
    }

    if (useSpinner) {
      spinner!.update("Validating source paths...");
    } else {
      log.info("Validating source paths...");
    }

    // Validate source paths for test case adapters
    for (const testCaseAdapter of config.adapters?.testCase || []) {
      const source = testCaseAdapter.options?.source;
      if (source && !source.startsWith("http")) {
        if (!existsSync(source)) {
          log.error(`✗ Source path '${source}' does not exist`);
          log.plain("Check the source path in your configuration");
          return;
        }
        log.success(`✓ Source path '${source}' exists`);
      }
    }

    if (useSpinner) {
      spinner!.update("Validating browser configuration...");
    } else {
      log.info("Validating browser configuration...");
    }

    // Validate browser configuration
    if (config.adapters?.browser?.options?.browser) {
      const browsers = Array.isArray(config.adapters.browser.options.browser)
        ? config.adapters.browser.options.browser
        : [config.adapters.browser.options.browser];

      for (const browser of browsers) {
        const browserName =
          typeof browser === "string" ? browser : browser.name;
        log.success(`✓ Browser '${browserName}' configured`);
      }
    }

    if (useSpinner) {
      spinner!.succeed("Configuration is valid! ✅");
    } else {
      log.success("Configuration is valid! ✅");
    }

    log.plain("\n📋 Configuration Summary:");
    log.plain(
      `• Browser adapter: ${config.adapters?.browser?.name || "Not configured"}`
    );
    log.plain(
      `• Test case adapters: ${config.adapters?.testCase?.length || 0}`
    );
    log.plain(
      `• Threshold: ${config.comparison?.threshold || "Not configured"}`
    );
    log.plain(`• Screenshot directory: ${config.screenshotDir || "vividiff"}`);

    if (config.viewport) {
      const viewportKeys = Object.keys(config.viewport);
      log.plain(`• Viewports: ${viewportKeys.join(", ")}`);
    }
  } catch (error) {
    if (useSpinner) {
      spinner!.fail("Configuration validation failed");
    } else {
      log.error("Configuration validation failed");
    }
    ErrorHandler.handle(error, {
      command: "validate",
      operation: "configuration validation",
      suggestion: "Check your configuration file syntax and try again",
    });
  }
};

export const command: Command<ValidateOptions> = {
  name: "validate",
  description: "Validate configuration file and dependencies",
  handler: validateHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd.option("--config <path>", "Path to configuration file");
  },
};
