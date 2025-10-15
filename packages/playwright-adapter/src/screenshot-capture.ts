import type { ScreenshotOptions, ScreenshotResult } from "@visnap/protocol";
import type { Page, BrowserContext } from "playwright-core";

import {
  setupPage,
  navigateToUrl,
  handleWaitFor,
  injectGlobalCSS,
  NO_ANIMATIONS_CSS,
} from "./browser-context";
import { SCREENSHOT_ELEMENT_TIMEOUT } from "./constants";
import { executeInteractions } from "./interaction-executor";
import { buildElementsMaskCSS } from "./masking-css";
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
    timeout: SCREENSHOT_ELEMENT_TIMEOUT,
    state: "attached",
  });

  if (!storyElement) {
    const message = `Screenshot target not found with selector ${selector} for case ${caseId}`;
    console.error(message);
    throw new Error(message);
  }

  // Prefer locator for stability if available; otherwise use element handle
  const maybeLocator = (
    page as unknown as { locator?: (s: string) => any }
  ).locator?.bind(page);
  if (typeof maybeLocator === "function") {
    const locator = maybeLocator(selector);
    const buf = (await locator.screenshot({
      type: "png",
    })) as unknown as Uint8Array;
    return buf;
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
    // Disable animations if configured (adapter option) and not explicitly disabled per test
    if (
      !screenshotOptions.disableCSSInjection &&
      options.performance?.disableAnimations
    ) {
      try {
        await page.emulateMedia({ reducedMotion: "reduce" });
      } catch {
        /* ignore */
      }
      await injectGlobalCSS(page, NO_ANIMATIONS_CSS);
    }

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

    // Inject per-test elements-to-mask overlay CSS (independent of disableCSSInjection)
    if (
      Array.isArray(screenshotOptions.elementsToMask) &&
      screenshotOptions.elementsToMask.length > 0
    ) {
      const css = buildElementsMaskCSS(screenshotOptions.elementsToMask);
      if (css) {
        await injectGlobalCSS(page, css);
      }
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
    } catch (error) {
      // Log cleanup errors but don't fail the capture
      console.warn(`Failed to close page during cleanup: ${error}`);
    }
  }
}
