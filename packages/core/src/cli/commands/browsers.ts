import { spawn } from "child_process";

import { type Command as CommanderCommand } from "commander";

import { type Command } from "../types";

import log from "@/utils/logger";

// Why this command exists:
// - This project depends on `playwright-core`, which intentionally does NOT download browser binaries.
// - Users therefore need a separate step to install the actual browsers (chromium/firefox/webkit).
// - Providing `visual-testing-tool browsers install` gives a clear, first-party way to install required browsers
//   without making users remember Playwright-specific commands, improving onboarding and CI setup.
// - Internally this simply shells out to `npx playwright@latest install [browser]` and streams output.

const browsersHandler = async (
  subcommand: string,
  browser?: string
): Promise<void> => {
  if (subcommand === "install") {
    const args = browser
      ? ["playwright@latest", "install", browser]
      : ["playwright@latest", "install"];
    log.info(
      `Installing Playwright browsers${browser ? `: ${browser}` : ""}...`
    );
    await new Promise<void>((resolve, reject) => {
      const child = spawn("npx", args, {
        stdio: "inherit",
        shell: process.platform === "win32",
      });
      child.on("exit", code => {
        if (code === 0) resolve();
        else reject(new Error(`Install exited with code ${code}`));
      });
      child.on("error", err => reject(err));
    }).catch(e => {
      log.error(
        `Failed to install browsers: ${e instanceof Error ? e.message : String(e)}`
      );
      process.exitCode = 2;
    });
    if (process.exitCode !== 2) {
      log.success("Playwright browsers installed.");
    }
    return;
  }
  log.plain(
    "Usage: visual-testing-tool browsers install [chromium|firefox|webkit]"
  );
};

export const command: Command = {
  name: "browsers",
  description: "Manage Playwright browsers",
  handler: () => {
    log.plain(
      "Usage: visual-testing-tool browsers install [chromium|firefox|webkit]"
    );
  },
  configure: (cmd: CommanderCommand) => {
    cmd
      .command("install [browser]")
      .description("Install Playwright browsers (chromium|firefox|webkit)")
      .action((browser?: string) => browsersHandler("install", browser));
    return cmd;
  },
};
