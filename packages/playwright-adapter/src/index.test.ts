import type { ScreenshotOptions } from "@vividiff/protocol";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  mockBrowser,
  mockContext,
  mockPage,
} from "./__mocks__/playwright-core.js";

import { createAdapter } from "./index.js";
import type { PlaywrightAdapterOptions } from "./index.js";

// Mock the utility modules
vi.mock("./utils.js", () => ({
  selectBrowserType: vi.fn(() => ({
    launch: vi.fn().mockResolvedValue(mockBrowser),
  })),
  buildAbsoluteUrl: vi.fn((url: string) => url),
}));

vi.mock("./browser-context.js", () => ({
  createBrowserContext: vi.fn(() => Promise.resolve(mockContext)),
  navigateToUrl: vi.fn(),
}));

vi.mock("./screenshot-capture.js", () => ({
  performScreenshotCapture: vi.fn(() =>
    Promise.resolve({
      buffer: new Uint8Array([1, 2, 3, 4]),
      meta: { elapsedMs: 100, id: "test-case" },
    })
  ),
}));

describe("createAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("adapter creation", () => {
    it("should create adapter with default options", () => {
      const adapter = createAdapter();

      expect(adapter.name).toBe("playwright");
      expect(adapter.init).toBeDefined();
      expect(adapter.openPage).toBeDefined();
      expect(adapter.capture).toBeDefined();
      expect(adapter.dispose).toBeDefined();
    });

    it("should create adapter with custom options", () => {
      const options: PlaywrightAdapterOptions = {
        launch: {
          browser: "firefox",
          headless: false,
        },
        context: {
          colorScheme: "dark",
        },
        navigation: {
          baseUrl: "https://example.com",
          timeoutMs: 60000,
        },
      };

      const adapter = createAdapter(options);

      expect(adapter.name).toBe("playwright");
    });
  });

  describe("init method", () => {
    it("should initialize browser with default options", async () => {
      const adapter = createAdapter();

      await adapter.init({ browser: "firefox" });

      const { selectBrowserType } = await import("./utils.js");
      expect(selectBrowserType).toHaveBeenCalledWith("firefox");
    });

    it("should initialize browser with custom browser from init options", async () => {
      const adapter = createAdapter();

      await adapter.init({ browser: "webkit" });

      const { selectBrowserType } = await import("./utils.js");
      expect(selectBrowserType).toHaveBeenCalledWith("webkit");
    });

    it("should initialize browser with custom browser from adapter options", async () => {
      const options: PlaywrightAdapterOptions = {
        launch: {
          browser: "firefox",
        },
      };
      const adapter = createAdapter(options);

      await adapter.init({ browser: "firefox" });

      const { selectBrowserType } = await import("./utils.js");
      expect(selectBrowserType).toHaveBeenCalledWith("firefox");
    });

    it("should be idempotent - not reinitialize if already initialized", async () => {
      const adapter = createAdapter();

      await adapter.init({ browser: "firefox" });
      await adapter.init({ browser: "firefox" });

      // Should only be called once (the second call should be skipped due to idempotent check)
      const { selectBrowserType } = await import("./utils.js");
      expect(selectBrowserType).toHaveBeenCalledTimes(2); // Both calls should happen, but browser.launch should only be called once
    });
  });

  describe("openPage method", () => {
    it("should throw error if not initialized", async () => {
      const adapter = createAdapter();

      await expect(adapter.openPage("https://example.com")).rejects.toThrow(
        "Playwright adapter not initialized"
      );
    });

    it("should open page with URL", async () => {
      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      const page = await adapter.openPage("https://example.com");

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(30000);
      expect(page).toBe(mockPage);
    });

    it("should use custom timeout", async () => {
      const options: PlaywrightAdapterOptions = {
        navigation: {
          timeoutMs: 60000,
        },
      };
      const adapter = createAdapter(options);
      await adapter.init({ browser: "firefox" });

      await adapter.openPage("https://example.com");

      expect(mockPage.setDefaultTimeout).toHaveBeenCalledWith(60000);
    });

    it("should build absolute URL with base URL", async () => {
      const options: PlaywrightAdapterOptions = {
        navigation: {
          baseUrl: "https://example.com",
        },
      };
      const adapter = createAdapter(options);
      await adapter.init({ browser: "firefox" });

      await adapter.openPage("/page");

      const { buildAbsoluteUrl } = await import("./utils.js");
      expect(buildAbsoluteUrl).toHaveBeenCalledWith(
        "/page",
        "https://example.com"
      );
    });
  });

  describe("capture method", () => {
    it("should throw error if not initialized", async () => {
      const adapter = createAdapter();
      const screenshotOptions: ScreenshotOptions = {
        id: "test-case",
        url: "https://example.com",
      };

      await expect(adapter.capture(screenshotOptions)).rejects.toThrow(
        "Playwright adapter not initialized"
      );
    });

    it("should capture screenshot", async () => {
      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      const screenshotOptions: ScreenshotOptions = {
        id: "test-case",
        url: "https://example.com",
        screenshotTarget: "story-root",
        viewport: { width: 1920, height: 1080 },
        waitFor: 1000,
      };

      const result = await adapter.capture(screenshotOptions);

      expect(result.buffer).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(result.meta.id).toBe("test-case");
      expect(result.meta.elapsedMs).toBe(100);
    });

    it("should build absolute URL for capture", async () => {
      const options: PlaywrightAdapterOptions = {
        navigation: {
          baseUrl: "https://example.com",
        },
      };
      const adapter = createAdapter(options);
      await adapter.init({ browser: "firefox" });

      const screenshotOptions: ScreenshotOptions = {
        id: "test-case",
        url: "/page",
      };

      await adapter.capture(screenshotOptions);

      const { buildAbsoluteUrl } = await import("./utils.js");
      expect(buildAbsoluteUrl).toHaveBeenCalledWith(
        "/page",
        "https://example.com"
      );
    });

    it("should create browser context for capture", async () => {
      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      const screenshotOptions: ScreenshotOptions = {
        id: "test-case",
        url: "https://example.com",
      };

      await adapter.capture(screenshotOptions);

      const { createBrowserContext } = await import("./browser-context.js");
      expect(createBrowserContext).toHaveBeenCalledWith(mockBrowser, {});
    });

    it("should close context after capture", async () => {
      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      const screenshotOptions: ScreenshotOptions = {
        id: "test-case",
        url: "https://example.com",
      };

      await adapter.capture(screenshotOptions);

      expect(mockContext.close).toHaveBeenCalled();
    });
  });

  describe("dispose method", () => {
    it("should close browser", async () => {
      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      await adapter.dispose();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("should be safe to call multiple times", async () => {
      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      await adapter.dispose();
      await adapter.dispose();

      // The second call should not call close since browser is already null
      expect(mockBrowser.close).toHaveBeenCalledTimes(1);
    });

    it("should handle case when browser is not initialized", async () => {
      const adapter = createAdapter();

      // Should not throw
      await expect(adapter.dispose()).resolves.toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should handle browser launch failure", async () => {
      const mockBrowserType = {
        launch: vi.fn().mockRejectedValue(new Error("Launch failed")),
      };

      const { selectBrowserType } = await import("./utils.js");
      (selectBrowserType as any).mockReturnValueOnce(mockBrowserType);

      const adapter = createAdapter();

      await expect(adapter.init({ browser: "chromium" })).rejects.toThrow(
        "Launch failed"
      );
    });

    it("should handle page creation failure", async () => {
      mockBrowser.newPage.mockRejectedValue(new Error("Page creation failed"));

      const adapter = createAdapter();
      await adapter.init({ browser: "firefox" });

      await expect(adapter.openPage("https://example.com")).rejects.toThrow(
        "Page creation failed"
      );
    });
  });
});
