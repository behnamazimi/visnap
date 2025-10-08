import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@visual-testing-tool/playwright-adapter",
      options: {
        // Option 1: Single browser (string)
        // browser: "firefox",

        // Option 2: Multiple browsers as simple array
        // browser: ["chromium", "firefox", "webkit"],

        // Option 3: Multiple browsers with detailed configuration
        browser: [
          { name: "chromium", options: { headless: true } },
          // { name: "firefox", options: { headless: true } },
          // { name: "webkit", options: { headless: true } }
        ],
      },
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
  threshold: 0.1,
  // Global viewport configuration that applies to all test cases unless overridden
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
  },
};

export default config;
