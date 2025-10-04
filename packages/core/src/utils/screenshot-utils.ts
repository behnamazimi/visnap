import { join } from "path";

import type { Browser } from "playwright-core";

import { type ResolvedStoryConfig } from "./config-resolver";
import { ScreenshotError, getErrorMessage } from "./error-handler";
import { getBaseDir, getCurrentDir } from "./fs";
import log from "./logger";
import { globalBrowserManager } from "./resource-cleanup";
import { resolveScreenshotSelector } from "./story-utils";

import { STORYBOOK_READY_TIMEOUT } from "@/constants";
import {
  type VTTConfig,
  type BrowserName,
  openPage,
  type ViewportSize,
} from "@/lib";
import { type VTTStory } from "@/types";

export interface ScreenshotOptions {
  mode: "test" | "update";
  sbUrl: string;
  browserName: BrowserName;
  browser: Browser;
  config: VTTConfig;
  story: VTTStory;
  resolvedConfig: ResolvedStoryConfig;
  viewportKey?: string;
  viewportSize?: ViewportSize;
}

/**
 * Take screenshots for a story with multiple viewports efficiently.
 * Uses a single page and changes viewport size for each screenshot.
 */
export const screenshotStoryWithViewports = async (
  opts: Omit<ScreenshotOptions, "viewportKey" | "viewportSize">
): Promise<void> => {
  const { mode, sbUrl, browserName, browser, config, story, resolvedConfig } =
    opts;

  // Create page with default viewport (will be changed per screenshot)
  const page = await openPage(browser, sbUrl);

  try {
    const url = `${sbUrl}?id=${story.id}`;
    await page.goto(url);
    await page.waitForFunction(() => window.__STORYBOOK_PREVIEW__.ready, null, {
      timeout: STORYBOOK_READY_TIMEOUT,
    });

    const selector = resolveScreenshotSelector(resolvedConfig.screenshotTarget);
    const storyElement = await page.waitForSelector(selector);
    if (!storyElement) {
      const message = `Screenshot target not found with selector ${selector} for story ${story.id}`;
      log.error(`Error: ${message}`);
      throw new ScreenshotError(message);
    }

    const outDir = mode === "test" ? getCurrentDir(config) : getBaseDir(config);

    if (resolvedConfig.viewport) {
      // Take screenshots for each viewport
      for (const [viewportKey, viewportSize] of Object.entries(
        resolvedConfig.viewport
      )) {
        log.dim(`Processing [${browserName}-${viewportKey}] ${story.id}`);

        // Change viewport size
        await page.setViewportSize(viewportSize);

        // Wait a bit for the layout to adjust
        await page.waitForTimeout(100);

        // Take screenshot
        await storyElement.screenshot({
          path: join(outDir, `${story.id}--${browserName}--${viewportKey}.png`),
        });
      }
    } else {
      // No viewport specified, take single screenshot
      log.dim(`Processing [${browserName}] ${story.id}`);
      await storyElement.screenshot({
        path: join(outDir, `${story.id}--${browserName}.png`),
      });
    }
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
