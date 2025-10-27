/**
 * @fileoverview Browser context management for Playwright adapter
 *
 * Provides functions for creating browser contexts, navigating to URLs,
 * and managing page lifecycle for the Playwright adapter.
 */

import type { Browser, Page, BrowserContext } from "playwright-core";

import {
  DEFAULT_PAGE_TIMEOUT,
  NETWORK_IDLE_FALLBACK_DELAY,
  NETWORK_IDLE_TIMEOUT_DIVISOR,
} from "./constants";

import type { PlaywrightAdapterOptions } from "./index";

/**
 * Creates a new browser context with the specified options.
 */
export async function createBrowserContext(
  browser: Browser,
  options: PlaywrightAdapterOptions,
  deviceScaleFactor?: number
): Promise<BrowserContext> {
  const context = await browser.newContext({
    ...options.context,
    colorScheme: options.context?.colorScheme ?? "light",
    reducedMotion: options.context?.reducedMotion ?? "reduce",
    ...(typeof deviceScaleFactor === "number" ? { deviceScaleFactor } : {}),
    ...(options.context?.storageStatePath
      ? { storageState: options.context.storageStatePath }
      : {}),
  });

  // Route and block heavy/irrelevant resources if configured
  const patterns = options.performance?.blockResources ?? [];
  if (patterns.length > 0) {
    const shouldBlock = (url: string): boolean => {
      // Simple substring matching; callers can provide hostnames, extensions, or paths
      // Examples: ".map", ".mp4", "fonts.gstatic.com", "/analytics"
      for (const p of patterns) {
        if (p && url.includes(p)) return true;
      }
      return false;
    };
    await context.route("**/*", route => {
      const url = route.request().url();
      if (shouldBlock(url)) {
        return route.abort();
      }
      return route.continue();
    });
  }

  return context;
}

/**
 * Waits for network idle state with fallback handling.
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number,
  fallbackDelay?: number,
  timeoutDivisor?: number
): Promise<void> {
  const effectiveFallbackDelay =
    fallbackDelay !== undefined ? fallbackDelay : NETWORK_IDLE_FALLBACK_DELAY;
  const effectiveTimeoutDivisor =
    timeoutDivisor !== undefined
      ? timeoutDivisor
      : NETWORK_IDLE_TIMEOUT_DIVISOR;

  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch {
    // Fall back to a small delay; not all drivers support networkidle well
    await page.waitForTimeout(
      Math.min(
        effectiveFallbackDelay,
        Math.floor(timeout / effectiveTimeoutDivisor)
      )
    );
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
    await waitForNetworkIdle(
      page,
      timeout,
      options.navigation?.networkIdleFallbackDelayMs,
      options.navigation?.networkIdleTimeoutDivisor
    );
  }
}

/**
 * Sets up a page with default timeout and viewport if specified.
 */
export async function setupPage(
  page: Page,
  viewport?: { width: number; height: number },
  timeout: number = DEFAULT_PAGE_TIMEOUT
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
  timeout: number = DEFAULT_PAGE_TIMEOUT
): Promise<void> {
  if (typeof waitFor === "number") {
    await page.waitForTimeout(waitFor);
  } else if (typeof waitFor === "string" && waitFor.trim()) {
    await page.waitForSelector(waitFor, { timeout });
  }
}

/**
 * Injects global CSS into the page for stable screenshots.
 * Useful for disabling animations, transitions, and hiding elements.
 */
export async function injectGlobalCSS(
  page: Page,
  cssString?: string
): Promise<void> {
  if (!cssString || cssString.trim().length === 0) {
    return;
  }

  try {
    await page.addStyleTag({ content: cssString });
  } catch (error) {
    // Log error but don't fail the capture
    console.warn(`Failed to inject CSS: ${error}`);
  }
}

/** CSS that disables animations and transitions to improve visual stability */
export const NO_ANIMATIONS_CSS = `
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
  caret-color: transparent !important;
}
`;
