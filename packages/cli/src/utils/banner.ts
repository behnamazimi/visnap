import { getPackageInfo, log } from "@visnap/core";
import figlet from "figlet";

/**
 * Display the visnap ASCII art banner
 */
export async function displayBanner(): Promise<void> {
  // Skip banner in CI environments
  if (process.env.CI || process.env.NODE_ENV === "test") {
    return;
  }

  try {
    const pkg = await getPackageInfo();

    // Generate ASCII art
    const banner = figlet.textSync("visnap", {
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
    const pkg = await getPackageInfo();
    log.plain(`\n🚀 visnap - ${pkg.description}\n`);
  }
}
