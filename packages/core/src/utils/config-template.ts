/**
 * Shared configuration template utilities
 */

export interface ConfigTemplateOptions {
  configType: "ts" | "js";
  threshold?: number;
  adapters?: {
    browser?: string;
    testCase?: string;
  };
  viewport?: {
    desktop?: { width: number; height: number };
    tablet?: { width: number; height: number };
    mobile?: { width: number; height: number };
  };
  reporter?: {
    html?: boolean;
    json?: boolean;
  };
}

/**
 * Generates the base configuration object as a string
 */
export function generateConfigObject(options: ConfigTemplateOptions): string {
  const {
    threshold = 0.1,
    adapters = {
      browser: "@visnap/playwright-adapter",
      testCase: "@visnap/storybook-adapter",
    },
    viewport = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 },
    },
    reporter = { html: true, json: true },
  } = options;

  return `{
  adapters: {
    browser: {
      name: "${adapters.browser}",
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
        name: "${adapters.testCase}",
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
    threshold: ${threshold},
    diffColor: "#00ff00",
  },
  // Global viewport configuration that applies to all test cases unless overridden
  viewport: {
    desktop: { width: ${viewport.desktop?.width || 1920}, height: ${viewport.desktop?.height || 1080} },
    // tablet: { width: ${viewport.tablet?.width || 768}, height: ${viewport.tablet?.height || 1024} },
    // mobile: { width: ${viewport.mobile?.width || 375}, height: ${viewport.mobile?.height || 667} },
  },
  runtime: {
    maxConcurrency: 4,
    quiet: false,
  },
  reporter: {
    html: ${reporter.html},
    json: ${reporter.json},
  }
}`;
}

/**
 * Generates complete TypeScript configuration file content
 */
export function generateTypeScriptConfig(
  options: ConfigTemplateOptions
): string {
  const configObject = generateConfigObject(options);

  return `import { type VisualTestingToolConfig } from "@visnap/protocol";

const config: VisualTestingToolConfig = ${configObject};

export default config;
`;
}

/**
 * Generates complete JavaScript configuration file content
 */
export function generateJavaScriptConfig(
  options: ConfigTemplateOptions
): string {
  const configObject = generateConfigObject(options);

  return `const config = ${configObject};

export default config;
`;
}

/**
 * Generates configuration content based on type
 */
export function generateConfigContent(options: ConfigTemplateOptions): string {
  if (options.configType === "ts") {
    return generateTypeScriptConfig(options);
  } else {
    return generateJavaScriptConfig(options);
  }
}
