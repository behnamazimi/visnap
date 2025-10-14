import { existsSync } from "fs";
import { join } from "path";

import { log, resolveEffectiveConfig } from "@visnap/core";
import { type Command as CommanderCommand } from "commander";
import open from "open";

import { type Command } from "../types";
import { ErrorHandler } from "../utils/error-handler";

interface OpenOptions {
  config?: string;
}

const openHandler = async (options: OpenOptions): Promise<void> => {
  try {
    // Load config to get screenshot directory and HTML report path
    const cliOptions: any = options.config
      ? { configPath: options.config }
      : undefined;
    const config = await resolveEffectiveConfig({}, cliOptions);
    const screenshotDir = config.screenshotDir || "visnap";

    // Get HTML report path from config or use default
    let htmlReportPath: string;
    if (config.reporter?.html && typeof config.reporter.html === "string") {
      // Use the configured path as-is (could be relative or absolute)
      htmlReportPath = config.reporter.html;
    } else {
      // Use default path in screenshot directory
      htmlReportPath = join(screenshotDir, "report.html");
    }

    if (existsSync(htmlReportPath)) {
      log.info("Opening HTML report in browser");
      await open(htmlReportPath);
    } else {
      // Open screenshot directory in Finder
      if (!existsSync(screenshotDir)) {
        log.error(`Screenshot directory not found: ${screenshotDir}`);
        log.plain("Run 'visnap test' to generate test results");
        return;
      }

      log.info("Opening screenshot directory in Finder");
      await open(screenshotDir);
    }
  } catch (error) {
    ErrorHandler.handle(error, {
      command: "open",
      operation: "opening report or screenshot directory",
      suggestion:
        "Check if the visnap config exists and you have permission to open files",
    });
  }
};

export const command: Command<OpenOptions> = {
  name: "open",
  description: "Open HTML report in browser or screenshot directory in Finder",
  handler: openHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd.option("--config <path>", "Path to configuration file");
  },
};
