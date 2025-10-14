import type { BrowserName as BrowserNameProtocol } from "@visnap/protocol";
import { chromium, firefox, webkit, type BrowserType } from "playwright-core";

/**
 * Selects the appropriate Playwright browser type based on the browser name.
 */
export function selectBrowserType(name?: BrowserNameProtocol): BrowserType {
  const browserName = name || "chromium";

  switch (browserName) {
    case "firefox":
      return firefox;
    case "webkit":
      return webkit;
    default:
      return chromium;
  }
}

/**
 * Builds an absolute URL using a base URL when a relative URL is provided.
 */
export function buildAbsoluteUrl(url: string, baseUrl?: string): string {
  const trimmed = url.trim();

  if (!baseUrl) {
    return trimmed;
  }

  try {
    return new URL(trimmed, baseUrl).toString();
  } catch {
    return trimmed;
  }
}

/**
 * Resolves the screenshot target selector to the appropriate DOM selector.
 */
export function resolveScreenshotTarget(selector?: string): string {
  if (selector === "story-root") {
    return "#storybook-root";
  }

  if (!selector || selector === "body") {
    return "body";
  }

  return selector;
}
