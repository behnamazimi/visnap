import { type Command as CommanderCommand } from "commander";

/**
 * Command handler function type for commander.js
 */
export type CommandHandler = (...args: any[]) => Promise<void> | void;

/**
 * Command configuration interface for commander.js
 */
export interface Command {
  /** The command name */
  name: string;
  /** Command description for help text */
  description: string;
  /** Command usage pattern (optional) */
  usage?: string;
  /** Command aliases (optional) */
  aliases?: string[];
  /** The command handler function */
  handler: CommandHandler;
  /** Function to configure the command with options/arguments */
  configure?: (cmd: CommanderCommand) => CommanderCommand;
}

/**
 * Registry of all available commands
 */
export type CommandRegistry = Record<string, Command>;
