import { spawn } from "child_process";

import log from "@/utils/logger";

// Why this command exists:
// - This project depends on `playwright-core`, which intentionally does NOT download browser binaries.
// - Users therefore need a separate step to install the actual browsers (chromium/firefox/webkit).
// - Providing `visual-testing-tool browsers install` gives a clear, first-party way to install required browsers
//   without making users remember Playwright-specific commands, improving onboarding and CI setup.
// - Internally this simply shells out to `npx playwright@latest install [browser]` and streams output.

export const browsersCommand = async (): Promise<void> => {
  const sub = process.argv[3];
  if (sub === "install") {
    const browser = process.argv[4];
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
