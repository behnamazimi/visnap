import type { Browser, Page } from "playwright-core";
import { chromium, firefox, webkit } from "playwright-core";

import type { BrowserName, ViewportConfig, ViewportSize } from "./config";

import { DEFAULT_BROWSER } from "@/constants";
import { BrowserError, createBrowserErrorMessage } from "@/utils/error-handler";
import { globalBrowserManager } from "@/utils/resource-cleanup";
import { validateBrowserName } from "@/utils/validation";

/**
 * Determines which viewport size to use based on the viewport configuration.
 * Returns the first available viewport or undefined if none exist.
 */
export const getViewportSize = (
  viewportConfig?: ViewportConfig
): ViewportSize | undefined => {
  if (!viewportConfig) return undefined;

  const keys = Object.keys(viewportConfig);
  if (keys.length === 0) return undefined;

  // Return the first available viewport
  return viewportConfig[keys[0]];
};

/**
 * Gets viewport size and key from configuration.
 * Returns both the viewport size and the key name for logging and file naming.
 */
export const getViewportInfo = (
  viewportConfig?: ViewportConfig
): { size: ViewportSize; key: string } | undefined => {
  if (!viewportConfig) return undefined;

  const keys = Object.keys(viewportConfig);
  if (keys.length === 0) return undefined;

  // Return the first available viewport with its key
  const key = keys[0];
  return { size: viewportConfig[key], key };
};

export const launchBrowser = async (
  name: BrowserName = DEFAULT_BROWSER
): Promise<Browser> => {
  if (!validateBrowserName(name)) {
    throw new BrowserError(`Invalid browser name: ${name}`);
  }

  try {
    let browser: Browser;
    if (name === "firefox") {
      browser = await firefox.launch({ headless: true });
    } else if (name === "webkit") {
      browser = await webkit.launch({ headless: true });
    } else {
      browser = await chromium.launch({ headless: true });
    }

    // Register browser for cleanup
    globalBrowserManager.registerBrowser(browser);
    return browser;
  } catch (error) {
    const message = createBrowserErrorMessage(name, error);
    throw new BrowserError(message, error instanceof Error ? error : undefined);
  }
};

export const openPage = async (
  browser: Browser,
  url: string,
  viewport?: ViewportSize
): Promise<Page> => {
  const page = await browser.newPage();

  // Register page for cleanup
  globalBrowserManager.registerPage(page);

  // Set viewport if provided
  if (viewport) {
    await page.setViewportSize(viewport);
  }

  await page.goto(url);
  return page;
};
