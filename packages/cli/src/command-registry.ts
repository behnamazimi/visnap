/**
 * Command Registry - The single source of truth for all commands
 *
 * HOW TO ADD A NEW COMMAND:
 * 1. Create your command file in ./commands/
 * 2. Export a `command` object conforming to the Command interface
 * 3. Import it here and add to the registry
 *
 * This approach provides:
 * ✅ Single place to manage commands
 * ✅ Bundle-friendly (no dynamic imports with variables)
 * ✅ TypeScript safety
 * ✅ Tree-shaking friendly
 * ✅ Easy to maintain
 */

import { command as initCommand } from "./commands/init";
import { command as listCommand } from "./commands/list";
import { command as openCommand } from "./commands/open";
import { command as testCommand } from "./commands/test";
import { command as updateCommand } from "./commands/update";
import { command as validateCommand } from "./commands/validate";
import { type Command } from "./types";

/**
 * Helper function to cast commands to the registry type
 */
const asCommand = <T>(command: Command<T>): Command<unknown> =>
  command as Command<unknown>;

/**
 * Registry of all available commands
 * Add new commands here after creating them
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
