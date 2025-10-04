import { type VTTConfig } from "../../../lib";

export const mockConfig: VTTConfig = {
  storybook: {
    source: "./storybook-static",
    screenshotTarget: "story-root",
  },
  screenshotDir: "visual-testing-tool",
  threshold: 0.1,
  browser: ["chromium"],
  concurrency: 2,
  include: ["**/*"],
  exclude: ["**/*.skip"],
};

export const mockConfigWithMultipleBrowsers: VTTConfig = {
  ...mockConfig,
  browser: ["chromium", "firefox", "webkit"],
};

export const mockConfigWithCustomThreshold: VTTConfig = {
  ...mockConfig,
  threshold: 0.05,
};

export const mockConfigWithCustomScreenshotDir: VTTConfig = {
  ...mockConfig,
  screenshotDir: "custom-screenshots",
};

export const mockConfigWithViewport: VTTConfig = {
  ...mockConfig,
  viewport: {
    mobile: { width: 375, height: 667 },
    desktop: { width: 1280, height: 720 },
  },
};
