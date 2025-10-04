const config = {
  storybook: {
    source: "./storybook-static",
    screenshotTarget: "story-root",
  },
  // include: ["Example*"],
  // exclude: ["*button*"],
  browser: ["chromium"],
  concurrency: 4,
  threshold: 0.1,
};

export default config;
