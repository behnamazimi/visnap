import { getPackageInfo, setQuietMode } from "@vividiff/core";
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
      .option("--quiet", "Suppress output except errors")
      .hook("preAction", (thisCommand, _actionCommand) => {
        // Apply global options
        const globalOptions = thisCommand.opts() as GlobalCliOptions;

        // Handle quiet mode
        if (globalOptions.quiet) {
          setQuietMode(true);
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
