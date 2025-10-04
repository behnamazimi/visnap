import { join } from "path";

import type { Browser } from "playwright-core";

import { STORYBOOK_READY_TIMEOUT } from "../constants";
import { type VTTConfig, type BrowserName, openPage } from "../lib";
import { type VTTStory } from "../types";

import { resolveStoryConfig } from "./config-resolver";
import { ScreenshotError, getErrorMessage } from "./error-handler";
import { getBaseDir, getCurrentDir } from "./fs";
import log from "./logger";
import { globalBrowserManager } from "./resource-cleanup";
import { resolveScreenshotSelector } from "./story-utils";

export interface ScreenshotOptions {
  mode: "test" | "update";
  sbUrl: string;
  browserName: BrowserName;
  browser: Browser;
  config: VTTConfig;
  story: VTTStory;
}

export const screenshotStory = async (
  opts: ScreenshotOptions
): Promise<void> => {
  const { mode, sbUrl, browserName, browser, config, story } = opts;
  const page = await openPage(browser, sbUrl);

  try {
    log.dim(`Processing [${browserName}] ${story.id}`);
    const url = `${sbUrl}?id=${story.id}`;
    await page.goto(url);
    await page.waitForFunction(() => window.__STORYBOOK_PREVIEW__.ready, null, {
      timeout: STORYBOOK_READY_TIMEOUT,
    });

    // Use the clean config resolver pattern
    const resolvedConfig = resolveStoryConfig(story, config);
    const selector = resolveScreenshotSelector(resolvedConfig.screenshotTarget);

    const storyElement = await page.waitForSelector(selector);
    if (!storyElement) {
      const message = `Screenshot target not found with selector ${selector} for story ${story.id}`;
      log.error(`Error: ${message}`);
      throw new ScreenshotError(message);
    }

    const outDir = mode === "test" ? getCurrentDir(config) : getBaseDir(config);
    await storyElement.screenshot({
      path: join(outDir, `${story.id}--${browserName}.png`),
    });
  } catch (error) {
    const message = `Failed to process story ${story.id}: ${getErrorMessage(error)}`;
    log.error(`Error: ${message}`);
    throw new ScreenshotError(
      message,
      error instanceof Error ? error : undefined
    );
  } finally {
    await page.close();
    globalBrowserManager.removePage(page);
  }
};
