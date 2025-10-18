/**
 * @fileoverview Command loading utilities
 *
 * Provides functions for loading and registering CLI commands from the centralized
 * registry. Handles command validation and registration with the commander.js
 * program instance.
 */

import { log } from "@visnap/core";
import { type Command as CommanderCommand } from "commander";

import { COMMAND_REGISTRY } from "./command-registry";
import { type CommandRegistry } from "./types";

/**
 * Loads all available commands from the centralized registry
 * @returns Promise resolving to a CommandRegistry
 */
export async function loadCommands(): Promise<CommandRegistry> {
  const commands: CommandRegistry = {};

  // Load commands from the centralized registry
  for (const command of COMMAND_REGISTRY) {
    if (
      command &&
      typeof command.handler === "function" &&
      typeof command.description === "string" &&
      typeof command.name === "string"
    ) {
      commands[command.name] = command;
    } else {
      log.warn("Command has invalid structure, skipping.");
    }
  }

  return commands;
}

/**
 * Registers all loaded commands with a commander.js program
 * @param program - The commander.js program instance
 * @param commands - The loaded command registry
 */
export function registerCommands(
  program: CommanderCommand,
  commands: CommandRegistry
): void {
  for (const command of Object.values(commands)) {
    let cmd = program.command(command.name).description(command.description);

    if (command.aliases) {
      cmd = cmd.aliases(command.aliases);
    }

    if (command.configure) {
      cmd = command.configure(cmd);
    }

    cmd.action(command.handler);
  }
}
