/**
 * @fileoverview ViSnap banner display utilities
 *
 * Displays the ViSnap ASCII art banner and version information.
 * Includes fallback handling for environments where figlet may not be available.
 */

import { log } from "@visnap/core";
import figlet from "figlet";

/**
 * Displays the ViSnap ASCII art banner with version information.
 * @returns Promise that resolves when banner is displayed
 */
export async function displayBanner(): Promise<void> {
  // Skip banner in CI environments
  if (process.env.CI || process.env.NODE_ENV === "test") {
    return;
  }

  try {
    const pkg = await import("../../package.json", {
      assert: { type: "json" },
    });

    // Generate ASCII art
    const banner = figlet.textSync("visnap", {
      font: "ANSI Shadow",
      horizontalLayout: "default",
      verticalLayout: "default",
    });

    // Display banner with version
    log.plain("\n" + banner);
    log.plain(`Version: ${pkg.default.version}`);
    log.plain(`${pkg.default.description}\n`);
  } catch {
    // Fallback to simple text if figlet fails
    const pkg = await import("../../package.json", {
      assert: { type: "json" },
    });
    log.plain(`\n🚀 visnap - ${pkg.default.description}\n`);
  }
}
