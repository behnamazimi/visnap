import { type VisualTestingToolConfig } from "@visnap/protocol";

const config: VisualTestingToolConfig = {
  adapters: {
    browser: {
      name: "@visnap/playwright-adapter",
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

        // injectCSS: "* { animation: none !important; transition: none !important; }"

        // Timeout configurations (all optional)
        // screenshot: {
        //   waitForElementTimeoutMs: 2000, // Timeout for waiting for screenshot target element to appear
        // },
        // interaction: {
        //   defaultTimeoutMs: 5000, // Default timeout for interactions (clicks, fills, etc.)
        //   settleTimeMs: 100, // Wait time after interactions complete
        // },
        // navigation: {
        //   timeoutMs: 30000, // Main page/navigation timeout
        //   networkIdleFallbackDelayMs: 1000, // Fallback delay when networkidle fails
        //   networkIdleTimeoutDivisor: 10, // Divisor for fallback calculation
        // },
      },
    },
    testCase: [
      {
        name: "@visnap/storybook-adapter",
        options: {
          source: "./storybook-static",
          include: "*",
          // exclude: "*page*",
        },
      },
    ],
  },
  comparison: {
    core: "odiff", // or "pixelmatch"
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
