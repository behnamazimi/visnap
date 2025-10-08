import type { Browser, Page, BrowserContext } from "playwright-core";
import type { PlaywrightAdapterOptions } from "./index";

/**
 * Creates a new browser context with the specified options.
 */
export async function createBrowserContext(
  browser: Browser,
  options: PlaywrightAdapterOptions
): Promise<BrowserContext> {
  return await browser.newContext({
    ...options.context,
    colorScheme: options.context?.colorScheme ?? "light",
    reducedMotion: options.context?.reducedMotion ?? "reduce",
    ...(options.context?.storageStatePath
      ? { storageState: options.context.storageStatePath }
      : {}),
  });
}

/**
 * Waits for network idle state with fallback handling.
 */
export async function waitForNetworkIdle(page: Page, timeout: number): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {
    // Fall back to a small delay; not all drivers support networkidle well
    await page.waitForTimeout(Math.min(1000, Math.floor(timeout / 10)));
  }
}

/**
 * Navigates to a URL with the specified options and waits for the appropriate state.
 */
export async function navigateToUrl(
  page: Page,
  url: string,
  options: PlaywrightAdapterOptions,
  timeout: number
): Promise<void> {
  await page.goto(url, {
    waitUntil: options.navigation?.waitUntil ?? "load",
    timeout,
  });

  // Additional wait for network idle if specified
  if ((options.navigation?.waitUntil ?? "load") === "networkidle") {
    await waitForNetworkIdle(page, timeout);
  }
}

/**
 * Sets up a page with default timeout and viewport if specified.
 */
export async function setupPage(
  page: Page,
  viewport?: { width: number; height: number },
  timeout: number = 30000
): Promise<void> {
  page.setDefaultTimeout(timeout);

  if (viewport) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
  }
}

/**
 * Handles additional waiting based on the waitFor option.
 */
export async function handleWaitFor(
  page: Page,
  waitFor?: string | number,
  timeout: number = 30000
): Promise<void> {
  if (typeof waitFor === "number") {
    await page.waitForTimeout(waitFor);
  } else if (typeof waitFor === "string" && waitFor.trim()) {
    await page.waitForSelector(waitFor, { timeout });
  }
}
