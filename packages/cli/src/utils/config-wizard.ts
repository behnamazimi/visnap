import { existsSync } from "fs";

import {
  log,
  generateConfigContent as generateConfigContentTemplate,
} from "@visnap/core";
import inquirer from "inquirer";

import { createSpinner } from "./spinner";

export interface AdapterSelection {
  configType: "ts" | "js";
  browserAdapter: "playwright" | "skip";
  testCaseAdapter: "storybook" | "url" | "skip";
  browsers: string[];
  storybookSource: string;
  storybookPort: number;
  comparisonEngine: "odiff" | "pixelmatch";
  threshold: number;
  viewportPreset: string;
}

export interface PackageManager {
  name: "npm" | "yarn" | "pnpm";
  installCommand: string;
}

/**
 * Detect package manager from lock files
 */
function detectPackageManager(): PackageManager {
  if (existsSync("pnpm-lock.yaml")) {
    return { name: "pnpm", installCommand: "pnpm add" };
  }
  if (existsSync("yarn.lock")) {
    return { name: "yarn", installCommand: "yarn add" };
  }
  return { name: "npm", installCommand: "npm install" };
}

/**
 * Check if a package is installed
 */
function isPackageInstalled(packageName: string): boolean {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Install missing packages
 */
async function installPackages(
  packages: string[],
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner();

  try {
    spinner.start(`Installing ${packages.join(", ")}...`);

    const { execSync } = await import("child_process");
    const command = `${packageManager.installCommand} ${packages.join(" ")}`;

    execSync(command, { stdio: "pipe" });

    spinner.succeed(`Successfully installed ${packages.join(", ")}`);
  } catch (error) {
    spinner.fail("Failed to install packages");
    throw error;
  }
}

/**
 * Interactive configuration wizard
 */
export async function runConfigWizard(): Promise<AdapterSelection> {
  console.clear();
  log.info("🚀 Welcome to visnap configuration wizard!");
  log.info(
    "This will help you set up visual regression testing for your project.\n"
  );

  const packageManager = detectPackageManager();
  log.info(`Detected package manager: ${packageManager.name}`);

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "configType",
      message: "Choose configuration file type:",
      choices: [
        { name: "TypeScript (.ts)", value: "ts" },
        { name: "JavaScript (.js)", value: "js" },
      ],
      default: "ts",
    },
    {
      type: "list",
      name: "browserAdapter",
      message: "Choose browser adapter:",
      choices: [
        {
          name: "@visnap/playwright-adapter (recommended)",
          value: "playwright",
        },
        { name: "Skip - configure later", value: "skip" },
      ],
      default: "playwright",
    },
    {
      type: "list",
      name: "testCaseAdapter",
      message: "Choose test case adapter:",
      choices: [
        {
          name: "@visnap/storybook-adapter (for Storybook projects)",
          value: "storybook",
        },
        {
          name: "@visnap/url-adapter (for any website/URL)",
          value: "url",
        },
        { name: "Skip - configure later", value: "skip" },
      ],
      default: "storybook",
    },
  ]);

  const selection: AdapterSelection = {
    configType: answers.configType as "ts" | "js",
    browserAdapter: answers.browserAdapter as "playwright" | "skip",
    testCaseAdapter: answers.testCaseAdapter as "storybook" | "url" | "skip",
    browsers: [],
    storybookSource: "",
    storybookPort: 4477,
    comparisonEngine: "odiff",
    threshold: 0.1,
    viewportPreset: "desktop",
  };

  // Configure browser adapter
  if (selection.browserAdapter === "playwright") {
    const browserAnswers = await inquirer.prompt([
      {
        type: "checkbox",
        name: "browsers",
        message: "Select browsers to test:",
        choices: [
          { name: "Chromium", value: "chromium" },
          { name: "Firefox", value: "firefox" },
          { name: "WebKit", value: "webkit" },
        ],
        default: ["chromium"],
        validate: input =>
          input.length > 0 || "Please select at least one browser",
      },
    ]);
    selection.browsers = browserAnswers.browsers as string[];
  }

  // Configure test case adapter
  if (selection.testCaseAdapter === "storybook") {
    const storybookAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "source",
        message: "Storybook source (directory path or URL):",
        default: "./storybook-static",
        validate: (input: string) => {
          if (!input.trim()) return "Source is required";
          if (input.startsWith("http")) return true; // URL
          if (existsSync(input)) return true; // Existing directory
          return "Directory does not exist. You can create it later.";
        },
      },
      {
        type: "number",
        name: "port",
        message: "Port for local server:",
        default: 4477,
        when: (answers: { source: string }) =>
          !answers.source.startsWith("http"),
        validate: (input: string) => {
          const port = Number(input);
          return (
            (port > 0 && port < 65536) || "Port must be between 1 and 65535"
          );
        },
      },
    ] as any);
    selection.storybookSource = storybookAnswers.source as string;
    selection.storybookPort = Number(storybookAnswers.port) || 4477;
  }

  // Configure comparison settings
  const comparisonAnswers = await inquirer.prompt([
    {
      type: "list",
      name: "engine",
      message: "Comparison engine:",
      choices: [
        { name: "odiff (faster, recommended)", value: "odiff" },
        { name: "pixelmatch (more accurate)", value: "pixelmatch" },
      ],
      default: "odiff",
    },
    {
      type: "input",
      name: "threshold",
      message:
        "Pixel difference threshold (0.0 = strict, 0.1 = recommended, 1.0 = very lenient):",
      default: "0.1",
      validate: (input: string) => {
        const num = parseFloat(input);
        return (
          (num >= 0 && num <= 1) || "Threshold must be between 0.0 and 1.0"
        );
      },
    },
  ]);
  selection.comparisonEngine = comparisonAnswers.engine as
    | "odiff"
    | "pixelmatch";
  selection.threshold = parseFloat(comparisonAnswers.threshold as string);

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

/**
 * Generate configuration content from selection
 */
export function generateConfigFromSelection(
  selection: AdapterSelection
): string {
  // Use the shared template for basic config, then customize for wizard-specific options
  const baseConfig = generateConfigContentTemplate({
    configType: selection.configType,
    threshold: selection.threshold,
  });

  // For now, return the base config. In a more complex implementation,
  // we could parse and modify the generated config to include wizard-specific options
  return baseConfig;
}
