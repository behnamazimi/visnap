import { DEFAULT_BROWSER, DEFAULT_THRESHOLD } from "../constants";
import { type VTTConfig, type BrowserName } from "../lib";
import { type ViewportConfig } from "../lib/config";
import { type VTTStory } from "../types";

export interface ResolvedStoryConfig {
  skip: boolean;
  screenshotTarget: string;
  threshold: number;
  browsers: BrowserName[];
  viewport?: ViewportConfig;
}

/**
 * Resolves story-level configuration by merging story-specific configs with global configs.
 * Story-level configs take precedence over global configs.
 */
export const resolveStoryConfig = (
  story: VTTStory,
  globalConfig: VTTConfig
): ResolvedStoryConfig => {
  const storyConfig = story.visualTesting;

  // Resolve skip flag
  const skip = storyConfig.skip ?? false;

  // Resolve screenshot target
  const screenshotTarget =
    storyConfig.screenshotTarget ?? globalConfig.storybook.screenshotTarget;

  // Resolve threshold
  const threshold =
    storyConfig.threshold ?? globalConfig.threshold ?? DEFAULT_THRESHOLD;

  // Resolve browsers - story-level browser config overrides global
  let browsers: BrowserName[];
  if (storyConfig.browser) {
    browsers = Array.isArray(storyConfig.browser)
      ? storyConfig.browser
      : [storyConfig.browser];
  } else {
    browsers = globalConfig.browser
      ? Array.isArray(globalConfig.browser)
        ? globalConfig.browser
        : [globalConfig.browser]
      : [DEFAULT_BROWSER];
  }

  // Resolve viewport - story-level viewport overrides global completely
  const viewport = storyConfig.viewport ?? globalConfig.viewport;

  return {
    skip,
    screenshotTarget,
    threshold,
    browsers,
    viewport,
  };
};

/**
 * Checks if a story should be processed for a specific browser.
 * Takes into account story-level browser configuration.
 */
export const shouldProcessStoryForBrowser = (
  story: VTTStory,
  browser: BrowserName,
  globalConfig: VTTConfig
): boolean => {
  const resolvedConfig = resolveStoryConfig(story, globalConfig);
  return resolvedConfig.browsers.includes(browser);
};
