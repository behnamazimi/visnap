import { existsSync } from "fs";

import { log } from "@vividiff/core";
import inquirer from "inquirer";

import { createSpinner } from "./spinner";

export interface AdapterSelection {
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
  log.info("🚀 Welcome to vividiff configuration wizard!");
  log.info(
    "This will help you set up visual regression testing for your project.\n"
  );

  const packageManager = detectPackageManager();
  log.info(`Detected package manager: ${packageManager.name}`);

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "browserAdapter",
      message: "Choose browser adapter:",
      choices: [
        {
          name: "@vividiff/playwright-adapter (recommended)",
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
          name: "@vividiff/storybook-adapter (for Storybook projects)",
          value: "storybook",
        },
        {
          name: "@vividiff/url-adapter (for any website/URL)",
          value: "url",
        },
        { name: "Skip - configure later", value: "skip" },
      ],
      default: "storybook",
    },
  ]);

  const selection: AdapterSelection = {
    browserAdapter: answers.browserAdapter as "playwright" | "skip",
    testCaseAdapter: answers.testCaseAdapter as "storybook" | "url" | "skip",
    browsers: [],
    storybookSource: "",
    storybookPort: 6006,
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
        default: 6006,
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
    selection.storybookPort = Number(storybookAnswers.port) || 6006;
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
      message: "Pixel difference threshold (0.0-1.0):",
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
    !isPackageInstalled("@vividiff/playwright-adapter")
  ) {
    packagesToInstall.push("@vividiff/playwright-adapter");
  }

  if (
    selection.testCaseAdapter === "storybook" &&
    !isPackageInstalled("@vividiff/storybook-adapter")
  ) {
    packagesToInstall.push("@vividiff/storybook-adapter");
  }

  if (
    selection.testCaseAdapter === "url" &&
    !isPackageInstalled("@vividiff/url-adapter")
  ) {
    packagesToInstall.push("@vividiff/url-adapter");
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
      } catch {
        log.warn("Failed to install packages automatically");
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
  selection: AdapterSelection,
  configType: "ts" | "js"
): string {
  const configObject = `{
  adapters: {
    browser: {
      name: "@vividiff/playwright-adapter",
      options: {
        // Option 1: Single browser (string)
        ${selection.browsers.length === 1 ? `browser: "${selection.browsers[0]}",` : '// browser: "chromium",'}

        // Option 2: Multiple browsers as simple array
        ${
          selection.browsers.length > 1 &&
          selection.browsers.every(b => typeof b === "string")
            ? `browser: ${JSON.stringify(selection.browsers)},`
            : '// browser: ["chromium", "firefox", "webkit"],'
        }

        // Option 3: Multiple browsers with detailed configuration
        // browser: [
          // { name: "chromium", options: { headless: false } },
          // { name: "firefox", options: { headless: true } },
          // { name: "webkit", options: { headless: true } }
        // ],

        // injectCSS: "button { display: none !important; }"
      },
    },
    testCase: [
      ${
        selection.testCaseAdapter === "storybook"
          ? `{
        name: "@vividiff/storybook-adapter",
        options: {
          screenshotTarget: "#storybook-root",
          source: "${selection.storybookSource}",
          port: ${selection.storybookPort},
          include: "*",
          // exclude: "*page*",
        },
      }`
          : selection.testCaseAdapter === "url"
            ? `{
        name: "@vividiff/url-adapter",
        options: {
          urls: [
          // { id: "homepage", url: "http://localhost:3000/" },
            // { id: "about", url: "http://localhost:3000/about" },
            // Add more URLs as needed
          ],
          include: "*",
          // exclude: "*admin*",
        },
      }`
            : `// Add your test case adapter configuration here`
      }
    ],
  },
  comparison: {
    core: "${selection.comparisonEngine}",
    threshold: ${selection.threshold},
    diffColor: "#00ff00",
  },
  // Global viewport configuration that applies to all test cases unless overridden
  viewport: {
    desktop: { width: 1920, height: 1080 },
    // tablet: { width: 768, height: 1024 },
    // mobile: { width: 375, height: 667 },
  },
  runtime: {
    maxConcurrency: 4,
    quiet: false,
  },
  reporter: {
    html: true,
    json: true,
  },
}`;

  if (configType === "ts") {
    return `import { type VisualTestingToolConfig } from "@vividiff/protocol";

const config: VisualTestingToolConfig = ${configObject};

export default config;
`;
  } else {
    return `const config = ${configObject};

export default config;
`;
  }
}
