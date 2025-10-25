/**
 * @fileoverview Interactive prompt definitions for configuration wizard
 */

import inquirerImport from "inquirer";

// Handle both ESM and CommonJS inquirer imports
const inquirer = (inquirerImport as any).default || inquirerImport;

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

/**
 * Interactive configuration wizard prompts
 */
export async function runConfigWizardPrompts(): Promise<AdapterSelection> {
  console.clear();
  console.log("🚀 Welcome to visnap configuration wizard!");
  console.log(
    "This will help you set up visual regression testing for your project.\n"
  );

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
        validate: (input: string[]) =>
          input.length > 0 ? true : "Please select at least one browser",
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
          return true;
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

  return selection;
}
