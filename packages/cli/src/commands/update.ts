import {
  updateBaselineCli,
  log,
  runInDocker,
  DEFAULT_DOCKER_IMAGE,
} from "@visnap/core";
import {
  type VisualTestingToolConfig,
  type CliOptions,
} from "@visnap/protocol";
import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";
import { ErrorHandler } from "../utils/error-handler";
import { exit } from "../utils/exit";
import { selectTestCasesInteractively } from "../utils/interactive-selector";
import { createSpinner, shouldUseSpinner } from "../utils/spinner";

interface UpdateCommandOptions
  extends Partial<VisualTestingToolConfig>,
    CliOptions {
  docker?: boolean;
  config?: string;
  interactive?: boolean;
}

const updateHandler = async (options: UpdateCommandOptions): Promise<void> => {
  const useSpinner = shouldUseSpinner();
  const spinner = useSpinner ? createSpinner() : null;

  try {
    // Handle interactive mode
    if (options.interactive) {
      if (useSpinner) {
        spinner!.start("Discovering test cases for selection...");
      } else {
        log.info("Discovering test cases for selection...");
      }

      const cliOptions: CliOptions & { configPath?: string } = {
        include: options.include,
        exclude: options.exclude,
        ...(options.config ? { configPath: options.config } : {}),
      };

      const selectedTestCases = await selectTestCasesInteractively({
        cliOptions,
        message: "Select test cases to update",
      });

      if (useSpinner) {
        spinner!.stop();
      }

      if (selectedTestCases.length === 0) {
        log.info("No test cases selected. Exiting.");
        exit(0);
        return;
      }

      // Set the selected test cases as include patterns
      options.include = selectedTestCases;
    }

    if (options.docker) {
      if (useSpinner) {
        spinner!.start("Starting Docker container...");
      } else {
        log.info("Starting Docker container...");
      }
      const image = DEFAULT_DOCKER_IMAGE;
      const args: string[] = [
        "update",
        ...(options.config ? ["--config", options.config] : []),
        // Forward include patterns if present
        ...(options.include
          ? [
              "--include",
              ...(Array.isArray(options.include)
                ? options.include
                : [options.include]),
            ]
          : []),
        // Forward exclude patterns if present
        ...(options.exclude
          ? [
              "--exclude",
              ...(Array.isArray(options.exclude)
                ? options.exclude
                : [options.exclude]),
            ]
          : []),
      ];
      const status = await runInDocker({ image, args });
      if (useSpinner) {
        spinner!.succeed("Docker update completed");
      } else {
        log.success("Docker update completed");
      }
      exit(status);
      return;
    }

    if (useSpinner) {
      spinner!.start("Discovering test cases...");
    } else {
      log.info("Discovering test cases...");
    }
    const cliOptions: CliOptions & { configPath?: string } = {
      include: options.include,
      exclude: options.exclude,
      ...(options.config ? { configPath: options.config } : {}),
    };

    if (useSpinner) {
      spinner!.update("Capturing baseline screenshots...");
    } else {
      log.info("Capturing baseline screenshots...");
    }
    await updateBaselineCli(options, cliOptions);

    if (useSpinner) {
      spinner!.succeed("Baseline update completed successfully! ✅");
    } else {
      log.success("Baseline update completed successfully! ✅");
    }

    log.plain(
      "\n📸 Baseline screenshots have been captured and saved to the 'visnap/base/' directory"
    );
    log.plain(
      "These will be used as reference images for future visual comparisons"
    );

    if (options.include || options.exclude) {
      log.plain(
        `\nFilters applied: ${options.include ? `include=${options.include}` : ""} ${options.exclude ? `exclude=${options.exclude}` : ""}`
      );
    }

    log.plain("\nNext steps:");
    log.plain(
      "• Run 'visnap test' to compare current screenshots with baselines"
    );
    log.plain("• Run 'visnap list' to see all available test cases");

    exit(0);
  } catch (error) {
    if (useSpinner) {
      spinner!.fail("Baseline update failed");
    } else {
      log.error("Baseline update failed");
    }
    ErrorHandler.handle(error, {
      command: "update",
      operation: "baseline capture",
      suggestion: "Check your configuration and ensure Storybook is running",
    });
    exit(1);
  }
};

export const command: Command<UpdateCommandOptions> = {
  name: "update",
  description: "Capture baseline screenshots into visnap/base",
  handler: updateHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd
      .option("--config <path>", "Path to configuration file")
      .option("--docker", "Run inside Docker")
      .option("-i, --interactive", "Select test cases interactively")
      .option(
        "--include <pattern>",
        "Include test cases matching pattern (can be used multiple times)"
      )
      .option(
        "--exclude <pattern>",
        "Exclude test cases matching pattern (can be used multiple times)"
      );
  },
};
