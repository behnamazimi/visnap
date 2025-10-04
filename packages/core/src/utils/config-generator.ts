import { type InitOptions } from "../lib/api/init";

/**
 * Generate configuration file content based on options
 */
export function generateConfigContent(options: InitOptions): string {
  const {
    configType = "ts",
    browsers = ["chromium"],
    storybookSource = "./storybook-static",
  } = options;

  const browserConfig =
    browsers.length === 1 ? `"${browsers[0]}"` : JSON.stringify(browsers);

  const configObject = `{
  storybook: {
    source: "${storybookSource}",
    screenshotTarget: "story-root",
  },
  // include: ["Example*"],
  // exclude: ["*button*"],
  browser: ${browserConfig},
  concurrency: 4,
  threshold: 0.1,
}`;

  if (configType === "ts") {
    return `import { type VTTConfig } from "visual-testing-tool/core";

const config: VTTConfig = ${configObject};

export default config;
`;
  } else {
    return `const config = ${configObject};

export default config;
`;
  }
}

/**
 * Generate .gitignore content for screenshot directories
 */
export function generateGitignoreContent(): string {
  return `# Visual Testing Tool - Ignore generated screenshots
# Keep baseline screenshots in version control, ignore current and diff
current/
diff/
`;
}
