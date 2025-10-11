import { getPackageInfo, log } from "@vividiff/core";
import figlet from "figlet";

/**
 * Display the vividiff ASCII art banner
 */
export async function displayBanner(): Promise<void> {
  // Skip banner in CI environments
  if (process.env.CI || process.env.NODE_ENV === "test") {
    return;
  }

  try {
    const pkg = await getPackageInfo();

    // Generate ASCII art
    const banner = figlet.textSync("vividiff", {
      font: "ANSI Shadow",
      horizontalLayout: "default",
      verticalLayout: "default",
    });

    // Display banner with version
    log.plain("\n" + banner);
    log.plain(`Version: ${pkg.version}`);
    log.plain(`${pkg.description}\n`);
  } catch {
    // Fallback to simple text if figlet fails
    log.plain("\n🚀 vividiff - ${pkg.description}\n");
  }
}
