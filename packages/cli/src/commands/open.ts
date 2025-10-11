import { existsSync, readdirSync } from "fs";
import { join } from "path";

import { log } from "@vividiff/core";
import { type Command as CommanderCommand } from "commander";
import open from "open";

import { type Command } from "../types";
import { ErrorHandler } from "../utils/error-handler";
import { formatDiffPaths } from "../utils/formatter";

interface OpenOptions {
  config?: string;
}

const openHandler = async (
  options: OpenOptions & { testId?: string }
): Promise<void> => {
  const testId = (options as Record<string, unknown>).testId as
    | string
    | undefined;
  try {
    // Determine screenshot directory from config or use default
    const screenshotDir = "vividiff"; // TODO: Load from config

    if (testId) {
      // Open specific test diff
      const diffPath = join(screenshotDir, "diff", `${testId}.png`);

      if (!existsSync(diffPath)) {
        log.error(`Diff file not found: ${diffPath}`);
        log.plain("Available diff files:");

        const diffDir = join(screenshotDir, "diff");
        if (existsSync(diffDir)) {
          const diffFiles = readdirSync(diffDir).filter(file =>
            file.endsWith(".png")
          );
          if (diffFiles.length > 0) {
            diffFiles.forEach(file => log.plain(`  • ${file}`));
          } else {
            log.plain("  No diff files found");
          }
        } else {
          log.plain("  Diff directory does not exist");
        }
        return;
      }

      log.info(`Opening diff for test: ${testId}`);
      await open(diffPath);

      // Show file paths
      formatDiffPaths(screenshotDir, testId);
    } else {
      // Open diff directory
      const diffDir = join(screenshotDir, "diff");

      if (!existsSync(diffDir)) {
        log.error(`Diff directory not found: ${diffDir}`);
        log.plain("Run 'vividiff test' to generate diff files");
        return;
      }

      log.info("Opening diff directory");
      await open(diffDir);

      // List available diffs
      const diffFiles = readdirSync(diffDir).filter(file =>
        file.endsWith(".png")
      );

      if (diffFiles.length > 0) {
        log.plain(`\n📁 Found ${diffFiles.length} diff files:`);
        diffFiles.forEach(file => {
          const testId = file.replace(".png", "");
          log.plain(`  • ${testId}`);
        });
        log.plain("\nTo open a specific diff:");
        log.plain(`  vividiff open <testId>`);
      } else {
        log.plain("No diff files found in the directory");
      }
    }
  } catch (error) {
    ErrorHandler.handle(error, {
      command: "open",
      operation: "opening diff viewer",
      suggestion:
        "Check if the diff files exist and you have permission to open them",
    });
  }
};

export const command: Command<OpenOptions & { testId?: string }> = {
  name: "open",
  description: "Open diff images in default image viewer",
  handler: openHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd
      .argument("[testId]", "Test ID to open diff for")
      .option("--config <path>", "Path to configuration file");
  },
};
