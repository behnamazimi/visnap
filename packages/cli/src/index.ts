/**
 * @fileoverview CLI main
 *
 * Main entry point for the Visnap CLI application. Handles command line argument
 * parsing, global option processing, and command registration. Provides error
 * handling and graceful shutdown for the CLI application.
 */

import { getPackageInfo, setQuietMode } from "@visnap/core";
import type { CliOptions } from "@visnap/protocol";
import { Command } from "commander";

import { loadCommands, registerCommands } from "./command-loader";
import { displayBanner } from "./utils/banner";
import { ErrorHandler } from "./utils/error-handler";
import { exit } from "./utils/exit";

/**
 * Main CLI function that initializes and runs the application.
 * @returns Promise that resolves when the CLI execution completes.
 */
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
      .name("visnap")
      .description("Visual Testing Tool - CLI for visual regression testing")
      .version(pkg.version, "-v, --version", "Show version information")
      .option("--config <path>", "Path to configuration file")
      .option("--quiet", "Suppress output except errors")
      .hook("preAction", (thisCommand, _actionCommand) => {
        // Apply global options
        const globalOptions = thisCommand.opts() as CliOptions;

        // Handle quiet mode
        if (globalOptions.quiet) {
          setQuietMode(true);
        }
      });

    // Display banner (skip in quiet mode)
    const globalOptions = program.opts() as CliOptions;
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
      command: "visnap",
      operation: "CLI initialization",
      suggestion: "Check your installation and try again",
    });
    exit(1);
  }
};

// Call main function
main();
