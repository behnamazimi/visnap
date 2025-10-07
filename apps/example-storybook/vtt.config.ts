import { type VisualTestingToolConfig } from "@visual-testing-tool/protocol";

const config: VisualTestingToolConfig = {
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
  threshold: 0.1,
};

export default config;
