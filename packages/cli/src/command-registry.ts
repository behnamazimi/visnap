/**
 * @fileoverview Command registry
 *
 * Centralized registry for all CLI commands. This is the single source of truth
 * for command registration and provides a clean way to manage commands.
 */

import { command as initCommand } from "./commands/init";
import { command as listCommand } from "./commands/list";
import { command as openCommand } from "./commands/open";
import { command as testCommand } from "./commands/test";
import { command as updateCommand } from "./commands/update";
import { command as validateCommand } from "./commands/validate";
import { type Command } from "./types";

/**
 * Helper function to cast commands to the registry type.
 * @param command - Command to cast.
 * @returns Command cast to unknown type for registry compatibility.
 */
const asCommand = <T>(command: Command<T>): Command<unknown> =>
  command as Command<unknown>;

/**
 * Registry of all available commands.
 * Add new commands here after creating them.
 */
export const COMMAND_REGISTRY = [
  asCommand(initCommand),
  asCommand(testCommand),
  asCommand(updateCommand),
  asCommand(validateCommand),
  asCommand(listCommand),
  asCommand(openCommand),
  // Add new commands here
] as const;
