import { type InitOptions } from "@/lib/api/init";

/**
 * Generate configuration file content based on options
 */
export function generateConfigContent(options: InitOptions): string {
  const { configType = "ts", threshold = 0.1 } = options;

  const configObject = `{
  adapters: {
    browser: {
      name: "@visual-testing-tool/playwright-adapter",
    },
    testCase: [
      {
        name: "@visual-testing-tool/storybook-adapter",
        options: {
          source: "./storybook-static",
          include: "*",
          // exclude: "*page*",
        },
      },
    ],
  },
  threshold: ${threshold},
  // Global viewport configuration that applies to all test cases unless overridden
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
}`;

  if (configType === "ts") {
    return `import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";

const config: VisualTestingToolConfig = ${configObject};

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
