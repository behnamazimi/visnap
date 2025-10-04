import type { Browser, Page } from "playwright-core";
import { chromium, firefox, webkit } from "playwright-core";

import { DEFAULT_BROWSER } from "../constants";
import {
  BrowserError,
  createBrowserErrorMessage,
} from "../utils/error-handler";
import { globalBrowserManager } from "../utils/resource-cleanup";
import { validateBrowserName } from "../utils/validation";

import type { BrowserName } from "./config";

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
  url: string
): Promise<Page> => {
  const page = await browser.newPage();

  // Register page for cleanup
  globalBrowserManager.registerPage(page);

  await page.goto(url);
  return page;
};
