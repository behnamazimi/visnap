import { getPackageInfo, log } from "@vividiff/core";
import { Command } from "commander";

import { loadCommands, registerCommands } from "./command-loader";
import { type GlobalCliOptions } from "./types/cli-options";
import { displayBanner } from "./utils/banner";
import { ErrorHandler } from "./utils/error-handler";
import { exit } from "./utils/exit";

const main = async (): Promise<void> => {
  try {
    // Set up error handling
    ErrorHandler.handleUnhandledRejection();
    ErrorHandler.handleSigint();

    // Create the commander program
    const program = new Command();

    // Get package info for version
    const pkg = await getPackageInfo();

    // Configure the main program with global options
    program
      .name("vividiff")
      .description("Visual Testing Tool - CLI for visual regression testing")
      .version(pkg.version, "-v, --version", "Show version information")
      .option("--config <path>", "Path to configuration file")
      .option("--verbose", "Enable verbose output")
      .option("--quiet", "Suppress output except errors")
      .option("--no-color", "Disable colored output")
      .hook("preAction", (thisCommand, _actionCommand) => {
        // Apply global options
        const globalOptions = thisCommand.opts() as GlobalCliOptions;

        // Handle quiet mode
        if (globalOptions.quiet) {
          // Suppress all log output except errors
          const originalLog = log;
          Object.keys(originalLog).forEach(key => {
            if (key !== "error") {
              (originalLog as Record<string, unknown>)[key] = () => {};
            }
          });
        }

        // Handle no-color mode
        if (globalOptions.noColor) {
          process.env.FORCE_COLOR = "0";
        }

        // Handle verbose mode
        if (globalOptions.verbose) {
          process.env.VIVIDIFF_VERBOSE = "1";
        }
      });

    // Display banner (skip in quiet mode)
    const globalOptions = program.opts() as GlobalCliOptions;
    if (!globalOptions.quiet) {
      await displayBanner();
    }

    // Load and register dynamic commands
    const commands = await loadCommands();
    registerCommands(program, commands);

    // Parse arguments and execute
    await program.parseAsync();
  } catch (error) {
    ErrorHandler.handle(error, {
      command: "vividiff",
      operation: "CLI initialization",
      suggestion: "Check your installation and try again",
    });
    exit(1);
  }
};

// Call main function
main();
