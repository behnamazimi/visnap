import chalk from "chalk";

type Logger = {
  plain: (message: string, force?: boolean) => void;
  info: (message: string, force?: boolean) => void;
  warn: (message: string, force?: boolean) => void;
  success: (message: string, force?: boolean) => void;
  error: (message: string, force?: boolean) => void;
  dim: (message: string, force?: boolean) => void;
  debug: (message: string, ...args: unknown[]) => void;
};

let _isQuiet = false;

export function setQuietMode(quiet: boolean): void {
  _isQuiet = quiet;
}

const isQuietMode = () => _isQuiet;

export function isQuiet(): boolean {
  return _isQuiet;
}

const logger: Logger = Object.freeze({
  plain: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(message);
    }
  },
  info: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(`${chalk.cyan("i")} ${message}`);
    }
  },
  warn: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.warn(`${chalk.yellow("!")} ${message}`);
    }
  },
  success: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(`${chalk.green("✔")} ${message}`);
    }
  },
  error: (message: string, _force = false) => {
    // Error always shows, but we can still respect force parameter for consistency
    console.error(`${chalk.red("✖")} ${message}`);
  },
  dim: (message: string, force = false) => {
    if (!isQuietMode() || force) {
      console.log(chalk.dim(message));
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (!isQuietMode()) {
      console.log(chalk.gray(`🐛 ${message}`), ...args);
    }
  },
});

export default logger;
export const log = logger;
