import { type VisualTestingToolConfig } from "@vividiff/protocol";

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@vividiff/playwright-adapter",
      options: {
        browser: ["chromium", "firefox"],
      },
    },
    testCase: [
      {
        name: "@vividiff/storybook-adapter",
        options: {
          source: "./storybook-static",
          port: 6006,
          include: "*",
        },
      },
    ],
  },
  comparison: {
    core: "odiff",
    threshold: 0.1,
    diffColor: "#00ff00",
  },
  runtime: {
    maxConcurrency: 4,
  },
};

export default config;
