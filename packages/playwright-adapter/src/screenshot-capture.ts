import type { ScreenshotOptions, ScreenshotResult } from "@vividiff/protocol";
import type { Page, BrowserContext } from "playwright-core";

import {
  setupPage,
  navigateToUrl,
  handleWaitFor,
  injectGlobalCSS,
} from "./browser-context";
import { executeInteractions } from "./interaction-executor";
import { resolveScreenshotTarget } from "./utils";

import type { PlaywrightAdapterOptions } from "./index";

/**
 * Captures a screenshot of the specified element on the page.
 */
export async function captureElementScreenshot(
  page: Page,
  screenshotTarget: string,
  caseId: string
): Promise<Uint8Array> {
  const selector = resolveScreenshotTarget(screenshotTarget);

  const storyElement = await page.waitForSelector(selector, {
    timeout: 2000,
    state: "attached",
  });

  if (!storyElement) {
    const message = `Screenshot target not found with selector ${selector} for case ${caseId}`;
    console.error(message);
    throw new Error(message);
  }

  return (await storyElement.screenshot({
    type: "png",
  })) as unknown as Uint8Array;
}

/**
 * Performs the complete screenshot capture process for a given URL and options.
 */
export async function performScreenshotCapture(
  context: BrowserContext,
  options: PlaywrightAdapterOptions,
  screenshotOptions: ScreenshotOptions,
  timeout: number
): Promise<ScreenshotResult> {
  const start = Date.now();
  let page: Page | null = null;

  try {
    page = await context.newPage();

    // Set up the page with viewport and timeout
    await setupPage(page, screenshotOptions.viewport, timeout);

    // Navigate to the target URL
    await navigateToUrl(page, screenshotOptions.url, options, timeout);

    // Handle additional waiting if specified
    await handleWaitFor(page, screenshotOptions.waitFor, timeout);

    // Execute interactions if provided
    if (
      screenshotOptions.interactions &&
      screenshotOptions.interactions.length > 0
    ) {
      await executeInteractions(
        page,
        screenshotOptions.interactions,
        screenshotOptions.id
      );
    }

    // Inject global CSS if enabled and not disabled for this test case
    if (!screenshotOptions.disableCSSInjection && options.injectCSS) {
      await injectGlobalCSS(page, options.injectCSS);
    }

    // Capture the screenshot
    const buffer = await captureElementScreenshot(
      page,
      screenshotOptions.screenshotTarget || "body",
      screenshotOptions.id
    );

    return {
      buffer,
      meta: {
        elapsedMs: Date.now() - start,
        id: screenshotOptions.id,
      },
    };
  } finally {
    // Clean up the page
    try {
      await page?.close();
    } catch {
      // Ignore cleanup errors
    }
  }
}
