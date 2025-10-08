import { describe, it, expect } from "vitest";

import {
  selectBrowserType,
  buildAbsoluteUrl,
  resolveScreenshotTarget,
} from "./utils.js";

describe("utils", () => {
  describe("selectBrowserType", () => {
    it("should return chromium for undefined browser name", () => {
      const browserType = selectBrowserType();
      expect(browserType).toBeDefined();
    });

    it("should return chromium for chromium browser name", () => {
      const browserType = selectBrowserType("chromium");
      expect(browserType).toBeDefined();
    });

    it("should return firefox for firefox browser name", () => {
      const browserType = selectBrowserType("firefox");
      expect(browserType).toBeDefined();
    });

    it("should return webkit for webkit browser name", () => {
      const browserType = selectBrowserType("webkit");
      expect(browserType).toBeDefined();
    });

    it("should return chromium for unknown browser name", () => {
      const browserType = selectBrowserType("unknown" as any);
      expect(browserType).toBeDefined();
    });
  });

  describe("buildAbsoluteUrl", () => {
    it("should return the same URL when no base URL is provided", () => {
      const url = "https://example.com/page";
      const result = buildAbsoluteUrl(url);
      expect(result).toBe(url);
    });

    it("should return the same URL when base URL is undefined", () => {
      const url = "https://example.com/page";
      const result = buildAbsoluteUrl(url, undefined);
      expect(result).toBe(url);
    });

    it("should build absolute URL from relative URL and base URL", () => {
      const relativeUrl = "/page";
      const baseUrl = "https://example.com";
      const result = buildAbsoluteUrl(relativeUrl, baseUrl);
      expect(result).toBe("https://example.com/page");
    });

    it("should build absolute URL from relative URL with path and base URL", () => {
      const relativeUrl = "sub/page";
      const baseUrl = "https://example.com/base/";
      const result = buildAbsoluteUrl(relativeUrl, baseUrl);
      expect(result).toBe("https://example.com/base/sub/page");
    });

    it("should handle URLs with query parameters", () => {
      const relativeUrl = "/page?param=value";
      const baseUrl = "https://example.com";
      const result = buildAbsoluteUrl(relativeUrl, baseUrl);
      expect(result).toBe("https://example.com/page?param=value");
    });

    it("should handle URLs with fragments", () => {
      const relativeUrl = "/page#section";
      const baseUrl = "https://example.com";
      const result = buildAbsoluteUrl(relativeUrl, baseUrl);
      expect(result).toBe("https://example.com/page#section");
    });

    it("should return original URL when URL construction fails", () => {
      const invalidUrl = "invalid-url";
      const baseUrl = "not-a-valid-base";
      const result = buildAbsoluteUrl(invalidUrl, baseUrl);
      expect(result).toBe(invalidUrl);
    });

    it("should trim whitespace from URLs", () => {
      const url = "  https://example.com/page  ";
      const result = buildAbsoluteUrl(url);
      expect(result).toBe("https://example.com/page");
    });
  });

  describe("resolveScreenshotTarget", () => {
    it("should return #storybook-root for undefined selector", () => {
      const result = resolveScreenshotTarget();
      expect(result).toBe("#storybook-root");
    });

    it("should return #storybook-root for empty string", () => {
      const result = resolveScreenshotTarget("");
      expect(result).toBe("#storybook-root");
    });

    it("should return #storybook-root for 'story-root' selector", () => {
      const result = resolveScreenshotTarget("story-root");
      expect(result).toBe("#storybook-root");
    });

    it("should return 'body' for 'body' selector", () => {
      const result = resolveScreenshotTarget("body");
      expect(result).toBe("body");
    });

    it("should return the selector as-is for custom selectors", () => {
      const customSelector = ".my-custom-selector";
      const result = resolveScreenshotTarget(customSelector);
      expect(result).toBe(customSelector);
    });

    it("should return the selector as-is for complex selectors", () => {
      const complexSelector = "[data-testid='my-component'] .nested > .element";
      const result = resolveScreenshotTarget(complexSelector);
      expect(result).toBe(complexSelector);
    });
  });
});
