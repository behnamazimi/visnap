import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  mockBrowser,
  mockContext,
  mockPage,
} from "./__mocks__/playwright-core.js";
import {
  createBrowserContext,
  waitForNetworkIdle,
  navigateToUrl,
  setupPage,
  handleWaitFor,
  injectGlobalCSS,
} from "./browser-context.js";

import type { PlaywrightAdapterOptions } from "./index.js";

describe("browser-context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createBrowserContext", () => {
    it("should create a browser context with default options", async () => {
      const options: PlaywrightAdapterOptions = {};

      const result = await createBrowserContext(mockBrowser, options);

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        colorScheme: "light",
        reducedMotion: "reduce",
      });
      expect(result).toBe(mockContext);
    });

    it("should create a browser context with custom options", async () => {
      const options: PlaywrightAdapterOptions = {
        context: {
          colorScheme: "dark",
          reducedMotion: "no-preference",
          storageStatePath: "/path/to/storage.json",
        },
      };

      const result = await createBrowserContext(mockBrowser, options);

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        colorScheme: "dark",
        reducedMotion: "no-preference",
        storageState: "/path/to/storage.json",
        storageStatePath: "/path/to/storage.json",
      });
      expect(result).toBe(mockContext);
    });

    it("should handle context options without storage state", async () => {
      const options: PlaywrightAdapterOptions = {
        context: {
          colorScheme: "dark",
          reducedMotion: "no-preference",
        },
      };

      await createBrowserContext(mockBrowser, options);

      expect(mockBrowser.newContext).toHaveBeenCalledWith({
        colorScheme: "dark",
        reducedMotion: "no-preference",
      });
    });
  });

  describe("waitForNetworkIdle", () => {
    it("should wait for network idle state", async () => {
      await waitForNetworkIdle(mockPage, 5000);

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", {
        timeout: 5000,
      });
    });

    it("should fallback to timeout when network idle fails", async () => {
      mockPage.waitForLoadState.mockRejectedValue(
        new Error("Network idle failed")
      );

      await waitForNetworkIdle(mockPage, 10000);

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", {
        timeout: 10000,
      });
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    });

    it("should use calculated timeout for fallback", async () => {
      mockPage.waitForLoadState.mockRejectedValue(
        new Error("Network idle failed")
      );

      await waitForNetworkIdle(mockPage, 5000);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
    });
  });

  describe("navigateToUrl", () => {
    it("should navigate to URL with default options", async () => {
      const options: PlaywrightAdapterOptions = {};

      await navigateToUrl(mockPage, "https://example.com", options, 30000);

      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
        waitUntil: "load",
        timeout: 30000,
      });
    });

    it("should navigate to URL with custom wait until option", async () => {
      const options: PlaywrightAdapterOptions = {
        navigation: {
          waitUntil: "domcontentloaded",
        },
      };

      await navigateToUrl(mockPage, "https://example.com", options, 30000);

      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    });

    it("should wait for network idle when specified", async () => {
      const options: PlaywrightAdapterOptions = {
        navigation: {
          waitUntil: "networkidle",
        },
      };

      await navigateToUrl(mockPage, "https://example.com", options, 30000);

      expect(mockPage.goto).toHaveBeenCalledWith("https://example.com", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      expect(mockPage.waitForLoadState).toHaveBeenCalledWith("networkidle", {
        timeout: 30000,
      });
    });
  });

  describe("setupPage", () => {
    it("should set default timeout", async () => {
      await setupPage(mockPage);

      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(30000);
    });

    it("should set custom timeout", async () => {
      await setupPage(mockPage, undefined, 15000);

      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(15000);
    });

    it("should set viewport size when provided", async () => {
      const viewport = { width: 1920, height: 1080 };

      await setupPage(mockPage, viewport);

      expect(mockPage.setViewportSize).toHaveBeenCalledWith({
        width: 1920,
        height: 1080,
      });
    });

    it("should not set viewport when not provided", async () => {
      await setupPage(mockPage);

      expect(mockPage.setViewportSize).not.toHaveBeenCalled();
    });
  });

  describe("handleWaitFor", () => {
    it("should wait for timeout when waitFor is a number", async () => {
      await handleWaitFor(mockPage, 1000);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(1000);
    });

    it("should wait for selector when waitFor is a string", async () => {
      await handleWaitFor(mockPage, ".my-selector");

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".my-selector", {
        timeout: 30000,
      });
    });

    it("should use custom timeout for selector wait", async () => {
      await handleWaitFor(mockPage, ".my-selector", 15000);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".my-selector", {
        timeout: 15000,
      });
    });

    it("should not wait when waitFor is empty string", async () => {
      await handleWaitFor(mockPage, "");

      expect(mockPage.waitForTimeout).not.toHaveBeenCalled();
      expect(mockPage.waitForSelector).not.toHaveBeenCalled();
    });

    it("should not wait when waitFor is whitespace only", async () => {
      await handleWaitFor(mockPage, "   ");

      expect(mockPage.waitForTimeout).not.toHaveBeenCalled();
      expect(mockPage.waitForSelector).not.toHaveBeenCalled();
    });

    it("should not wait when waitFor is undefined", async () => {
      await handleWaitFor(mockPage);

      expect(mockPage.waitForTimeout).not.toHaveBeenCalled();
      expect(mockPage.waitForSelector).not.toHaveBeenCalled();
    });
  });

  describe("injectGlobalCSS", () => {
    it("should inject CSS when valid CSS string is provided", async () => {
      const cssString = "* { animation: none !important; }";

      await injectGlobalCSS(mockPage, cssString);

      expect(mockPage.addStyleTag).toHaveBeenCalledWith({
        content: cssString,
      });
    });

    it("should not inject CSS when string is empty", async () => {
      await injectGlobalCSS(mockPage, "");

      expect(mockPage.addStyleTag).not.toHaveBeenCalled();
    });

    it("should not inject CSS when string is only whitespace", async () => {
      await injectGlobalCSS(mockPage, "   \n\t  ");

      expect(mockPage.addStyleTag).not.toHaveBeenCalled();
    });

    it("should not inject CSS when string is undefined", async () => {
      await injectGlobalCSS(mockPage, undefined);

      expect(mockPage.addStyleTag).not.toHaveBeenCalled();
    });

    it("should handle CSS injection errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockPage.addStyleTag.mockRejectedValue(new Error("CSS injection failed"));

      const cssString = "invalid css {";

      await injectGlobalCSS(mockPage, cssString);

      expect(mockPage.addStyleTag).toHaveBeenCalledWith({
        content: cssString,
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to inject CSS: Error: CSS injection failed"
      );

      consoleSpy.mockRestore();
    });

    it("should inject complex CSS with multiple rules", async () => {
      const cssString = `
        * {
          animation: none !important;
          transition: none !important;
        }
        .loader {
          display: none !important;
        }
        .spinner {
          visibility: hidden !important;
        }
      `;

      await injectGlobalCSS(mockPage, cssString);

      expect(mockPage.addStyleTag).toHaveBeenCalledWith({
        content: cssString,
      });
    });

    it("should inject CSS with media queries", async () => {
      const cssString = `
        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
          }
        }
      `;

      await injectGlobalCSS(mockPage, cssString);

      expect(mockPage.addStyleTag).toHaveBeenCalledWith({
        content: cssString,
      });
    });
  });
});
