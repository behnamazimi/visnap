import chalk from "chalk";

type Logger = {
  plain: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  dim: (message: string) => void;
  debug: (message: string, ...args: unknown[]) => void;
};

const logger: Logger = Object.freeze({
  plain: (message: string) => {
    console.log(message);
  },
  info: (message: string) => {
    console.log(`${chalk.cyan("i")} ${message}`);
  },
  warn: (message: string) => {
    console.warn(`${chalk.yellow("!")} ${message}`);
  },
  success: (message: string) => {
    console.log(`${chalk.green("✔")} ${message}`);
  },
  error: (message: string) => {
    console.error(`${chalk.red("✖")} ${message}`);
  },
  dim: (message: string) => {
    console.log(chalk.dim(message));
  },
  debug: (message: string, ...args: unknown[]) => {
    console.log(chalk.gray(`🐛 ${message}`), ...args);
  },
});

export default logger;
export const log = logger;
