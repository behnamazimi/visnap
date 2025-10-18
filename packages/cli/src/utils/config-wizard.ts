import { log } from "@visnap/core";
import inquirer from "inquirer";

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

  if (
    selection.browserAdapter === "playwright" &&
    !isPackageInstalled("@visnap/playwright-adapter")
  ) {
    packagesToInstall.push("@visnap/playwright-adapter");
  }

  if (
    selection.testCaseAdapter === "storybook" &&
    !isPackageInstalled("@visnap/storybook-adapter")
  ) {
    packagesToInstall.push("@visnap/storybook-adapter");
  }

  if (
    selection.testCaseAdapter === "url" &&
    !isPackageInstalled("@visnap/url-adapter")
  ) {
    packagesToInstall.push("@visnap/url-adapter");
  }

  if (packagesToInstall.length > 0) {
    const installAnswer = await inquirer.prompt([
      {
        type: "confirm",
        name: "install",
        message: `Install missing packages: ${packagesToInstall.join(", ")}?`,
        default: true,
      },
    ]);

    if (installAnswer.install) {
      try {
        await installPackages(packagesToInstall, packageManager);
      } catch (error) {
        log.warn(`Failed to install packages automatically: ${error}`);
        log.plain(
          `Please install them manually: ${packageManager.installCommand} ${packagesToInstall.join(" ")}`
        );
      }
    }
  }

  return selection;
}

// Re-export generateConfigFromSelection from config-generator module
export { generateConfigFromSelection } from "./wizard/config-generator";
