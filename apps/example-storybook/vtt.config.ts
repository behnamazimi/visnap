import type { VTTConfig } from "visual-testing-tool/core";

const config: VTTConfig = {
  storybook: {
    source: "./storybook-static",
    screenshotTarget: "story-root",
    // include: ["Example*"],
    // exclude: ["*page*"],
  },
  browser: ["chromium"],
  concurrency: 2,
  threshold: 0.1,
  viewport: {
    mobile: { width: 375, height: 667 },
    desktop: { width: 1280, height: 720 },
  },
};

export default config;
