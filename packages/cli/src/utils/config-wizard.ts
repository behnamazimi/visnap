import { log } from "@visnap/core";
import inquirerImport from "inquirer";

// Handle both ESM and CommonJS inquirer imports
const inquirer = (inquirerImport as any).default || inquirerImport;

import {
  detectPackageManager,
  isPackageInstalled,
  installPackages,
} from "./wizard/package-manager";
import {
  runConfigWizardPrompts,
  type AdapterSelection,
} from "./wizard/prompts";

/**
 * Interactive configuration wizard
 */
export async function runConfigWizard(): Promise<AdapterSelection> {
  const packageManager = detectPackageManager();
  log.info(`Detected package manager: ${packageManager.name}`);

  const selection = await runConfigWizardPrompts();

  // Install missing packages
  const packagesToInstall: string[] = [];

  // Always include visnap cli for local installation
  if (!(await isPackageInstalled("@visnap/cli"))) {
    packagesToInstall.push("@visnap/cli");
  }

  if (
    selection.browserAdapter === "playwright" &&
    !(await isPackageInstalled("@visnap/playwright-adapter"))
  ) {
    packagesToInstall.push("@visnap/playwright-adapter");
  }

  if (
    selection.testCaseAdapter === "storybook" &&
    !(await isPackageInstalled("@visnap/storybook-adapter"))
  ) {
    packagesToInstall.push("@visnap/storybook-adapter");
  }

  if (
    selection.testCaseAdapter === "url" &&
    !(await isPackageInstalled("@visnap/url-adapter"))
  ) {
    packagesToInstall.push("@visnap/url-adapter");
  }

  if (packagesToInstall.length > 0) {
    const installAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "install",
        message: `Install missing packages locally in your project: ${packagesToInstall.join(", ")}?`,
        default: true,
      },
    ]);

    if (installAnswer.install) {
      try {
        await installPackages(packagesToInstall, packageManager);
        log.info(
          "Packages installed successfully! This ensures visnap can find all required adapters."
        );
      } catch (error) {
        log.warn(`Failed to install packages automatically: ${error}`);
        log.plain(
          `Please install them manually: ${packageManager.installCommand} -D ${packagesToInstall.join(" ")}`
        );
      }
    }
  }

  return selection;
}

// Re-export generateConfigFromSelection from config-generator module
export { generateConfigFromSelection } from "./wizard/config-generator";
