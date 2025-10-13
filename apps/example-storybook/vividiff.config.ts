import { type VisualTestingToolConfig } from "@vividiff/protocol";

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@vividiff/playwright-adapter",
      options: {
        // Option 1: Single browser (string)
        browser: "chromium",

        // Option 2: Multiple browsers as simple array
        // browser: ["chromium", "firefox", "webkit"],

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
      {
        name: "@vividiff/storybook-adapter",
        options: {
          source: "./storybook-static",
          port: 4477,
          include: "*",
          // exclude: "*page*",
        },
      },
      // {
      //   name: "@vividiff/url-adapter",
      //   options: {
      //     urls: [{ id: "homepage", url: "https://www.example.com/" }],
      //     include: "*",
      //     // exclude: "*admin*",
      //   },
      // },
    ],
  },
  comparison: {
    core: "odiff",
    threshold: 0.1,
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
};

export default config;
