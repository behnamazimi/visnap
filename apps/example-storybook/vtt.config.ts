import { type VTTConfig } from "@visual-testing-tool/core";

const config: VTTConfig = {
  // Adapters are optional; omit to disable
  adapters: {
    // Content adapter: Storybook
    storybook: {
      // e.g. path to static build or remote url
      source: "./storybook-static",
      port: 4477,
      include: ["*button*"],
      exclude: ["*page*"],
    },
    // Browser automation adapter: Playwright
    playwright: {
      // One or more browsers to run
      browsers: "chromium",
      // Example viewport presets (optional)
      viewport: {
        desktop: { width: 1440, height: 900 },
        mobile: { width: 375, height: 812 },
      },
      // Default element to screenshot; adapters and stories can override
      screenshotTarget: "story-root",
    },
  },
  concurrency: 4,
  threshold: 0.1,
};

export default config;
