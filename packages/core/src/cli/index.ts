import { browsersCommand } from "./commands/browsers";
import { initCommand } from "./commands/init";
import { testCommand } from "./commands/test";
import { updateCommand } from "./commands/update";

import { getPackageInfo } from "@/lib";
import { getErrorMessage } from "@/utils/error-handler";
import log from "@/utils/logger";
import { setupCleanup } from "@/utils/resource-cleanup";

const showVersion = async (): Promise<void> => {
  const pkg = await getPackageInfo();
  log.plain(`${pkg.name} ${pkg.version}`);
};

const showHelp = (): void => {
  const helpText = [
    "visual-testing-tool CLI",
    "Usage: visual-testing-tool [command]",
    "",
    "Commands:",
    "  init             Initialize a new VTT project with sample config",
    "  update           Capture baseline screenshots into visual-testing-tool/base",
    "  test             Capture current screenshots and compare with baseline",
    "  browsers install [name]   Install Playwright browsers (chromium|firefox|webkit)",
    "  --version, -v    Show version information",
    "  --help, -h       Show this help message",
    "",
    "Flags (test/update):",
    "  --include <globs>   Comma-separated list of story ids/titles to include",
    "  --exclude <globs>   Comma-separated list of story ids/titles to exclude",
    "  --json [path]       Write JSON report (defaults to visual-testing-tool-report.json)",
    "  --docker            Run the command inside the VTT Docker image",
    "  --dry-run           List matched stories without taking screenshots",
  ].join("\n");
  log.plain(helpText);
};

const showUnknownCommand = (command: string): void => {
  log.error(`Unknown command: ${command}`);
  log.dim("Run 'visual-testing-tool --help' for available commands.");
};

const commands = {
  init: initCommand,
  test: testCommand,
  update: updateCommand,
  browsers: browsersCommand,
  "--version": showVersion,
  "-v": showVersion,
  "--help": showHelp,
  "-h": showHelp,
} as const;

const main = async (): Promise<void> => {
  // Setup resource cleanup
  setupCleanup();

  const args = process.argv.slice(2);
  try {
    if (args.length === 0) {
      showHelp();
      return;
    }
    const command: string = args[0] ?? "";
    const handler = commands[command as keyof typeof commands];
    if (handler) {
      await handler();
    } else {
      showUnknownCommand(command);
      process.exit(1);
    }
  } catch (error) {
    log.error(`Error: ${getErrorMessage(error)}`);
    process.exit(1);
  }
};

// Call main function
main();
