/**
 * @fileoverview Browser utility functions for Playwright adapter
 *
 * Provides utility functions for browser type selection, URL building,
 * and screenshot target resolution for the Playwright adapter.
 */

import type { BrowserName as BrowserNameProtocol } from "@visnap/protocol";
import { chromium, firefox, webkit, type BrowserType } from "playwright-core";

/**
 * Selects the appropriate Playwright browser type based on the browser name
 * @param name - Browser name (chromium, firefox, webkit, or custom)
 * @returns Playwright BrowserType instance
 * @throws {Error} If browser name is not supported
 *
 * @example
 * ```typescript
 * const browserType = selectBrowserType("chromium");
 * const browser = await browserType.launch();
 * ```
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
 * Builds an absolute URL using a base URL when a relative URL is provided
 * @param url - URL to build (absolute or relative)
 * @param baseUrl - Base URL to use for relative URLs
 * @returns Absolute URL
 *
 * @example
 * ```typescript
 * const absoluteUrl = buildAbsoluteUrl("/about", "https://example.com");
 * // Returns "https://example.com/about"
 * ```
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
 * Resolves the screenshot target selector to the appropriate DOM selector
 * @param selector - Screenshot target selector (optional)
 * @returns CSS selector for screenshot capture
 *
 * @example
 * ```typescript
 * const selector = resolveScreenshotTarget("story-root");
 * // Returns "#storybook-root"
 *
 * const selector2 = resolveScreenshotTarget("#my-element");
 * // Returns "#my-element"
 * ```
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
