import {
  getPackageInfo,
  getErrorMessage,
  log,
  setupCleanup,
} from "@visual-testing-tool/core";
import { Command } from "commander";

import { loadCommands, registerCommands } from "./command-loader";

const main = async (): Promise<void> => {
  // Setup resource cleanup
  setupCleanup();

  try {
    // Create the commander program
    const program = new Command();

    // Get package info for version
    const pkg = await getPackageInfo();

    // Configure the main program
    program
      .name("visual-testing-tool")
      .description("Visual Testing Tool - CLI for visual regression testing")
      .version(pkg.version, "-v, --version", "Show version information");

    // Load and register dynamic commands
    const commands = await loadCommands();
    registerCommands(program, commands);

    // Parse arguments and execute
    await program.parseAsync();
  } catch (error) {
    log.error(`Error: ${getErrorMessage(error)}`);
    process.exit(1);
  }
};

// Call main function
main();
