import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  captureElementScreenshot,
  performScreenshotCapture,
} from "./screenshot-capture.js";
import { mockPage, mockContext, mockElement } from "./__mocks__/playwright-core.js";
import type { PlaywrightAdapterOptions } from "./index.js";
import type { ScreenshotOptions } from "@visual-testing-tool/protocol";

// Mock the utils module
vi.mock("./utils.js", () => ({
  resolveScreenshotTarget: vi.fn((selector?: string) => {
    if (!selector || selector === "story-root") return "#storybook-root";
    if (selector === "body") return "body";
    return selector;
  }),
}));

// Mock the browser-context module
vi.mock("./browser-context.js", () => ({
  setupPage: vi.fn(),
  navigateToUrl: vi.fn(),
  handleWaitFor: vi.fn(),
}));

describe("screenshot-capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("captureElementScreenshot", () => {
    it("should capture screenshot of element with default selector", async () => {
      const buffer = await captureElementScreenshot(mockPage, "story-root", "test-case-1");
      
      expect(mockPage.waitForSelector).toHaveBeenCalledWith("#storybook-root", {
        timeout: 2000,
        state: "attached",
      });
      expect(mockElement.screenshot).toHaveBeenCalledWith({
        type: "png",
      });
      expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("should capture screenshot of element with custom selector", async () => {
      const buffer = await captureElementScreenshot(mockPage, ".my-component", "test-case-2");
      
      expect(mockPage.waitForSelector).toHaveBeenCalledWith(".my-component", {
        timeout: 2000,
        state: "attached",
      });
      expect(mockElement.screenshot).toHaveBeenCalledWith({
        type: "png",
      });
      expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("should throw error when element is not found", async () => {
      mockPage.waitForSelector.mockResolvedValue(null);
      
      await expect(
        captureElementScreenshot(mockPage, ".not-found", "test-case-3")
      ).rejects.toThrow("Screenshot target not found with selector .not-found for case test-case-3");
    });

    it("should handle body selector", async () => {
      await captureElementScreenshot(mockPage, "body", "test-case-4");
      
      expect(mockPage.waitForSelector).toHaveBeenCalledWith("body", {
        timeout: 2000,
        state: "attached",
      });
    });
  });

  describe("performScreenshotCapture", () => {
    const mockOptions: PlaywrightAdapterOptions = {
      navigation: {
        waitUntil: "load",
      },
    };

    const mockScreenshotOptions: ScreenshotOptions = {
      id: "test-case-1",
      url: "https://example.com",
      screenshotTarget: "story-root",
      viewport: { width: 1920, height: 1080 },
      waitFor: 1000,
    };

    it("should perform complete screenshot capture process", async () => {
      const result = await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(result.buffer).toEqual(new Uint8Array([1, 2, 3, 4]));
      expect(result.meta.id).toBe("test-case-1");
      expect(result.meta.elapsedMs).toBeGreaterThanOrEqual(0);
    });

    it("should setup page with viewport", async () => {
      const { setupPage } = await import("./browser-context.js");
      
      await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(setupPage).toHaveBeenCalledWith(mockPage, mockScreenshotOptions.viewport, 30000);
    });

    it("should navigate to URL", async () => {
      const { navigateToUrl } = await import("./browser-context.js");
      
      await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(navigateToUrl).toHaveBeenCalledWith(
        mockPage,
        mockScreenshotOptions.url,
        mockOptions,
        30000
      );
    });

    it("should handle wait for option", async () => {
      const { handleWaitFor } = await import("./browser-context.js");
      
      await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(handleWaitFor).toHaveBeenCalledWith(
        mockPage,
        mockScreenshotOptions.waitFor,
        30000
      );
    });

    it("should close page after capture", async () => {
      await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(mockPage.close).toHaveBeenCalled();
    });

    it("should close page even if capture fails", async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error("Element not found"));
      
      await expect(
        performScreenshotCapture(
          mockContext,
          mockOptions,
          mockScreenshotOptions,
          30000
        )
      ).rejects.toThrow("Element not found");

      expect(mockPage.close).toHaveBeenCalled();
    });

    it("should handle screenshot options without viewport", async () => {
      const optionsWithoutViewport = {
        ...mockScreenshotOptions,
        viewport: undefined,
      };

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        optionsWithoutViewport,
        30000
      );

      const { setupPage } = await import("./browser-context.js");
      expect(setupPage).toHaveBeenCalledWith(mockPage, undefined, 30000);
    });

    it("should handle screenshot options without waitFor", async () => {
      const optionsWithoutWaitFor = {
        ...mockScreenshotOptions,
        waitFor: undefined,
      };

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        optionsWithoutWaitFor,
        30000
      );

      const { handleWaitFor } = await import("./browser-context.js");
      expect(handleWaitFor).toHaveBeenCalledWith(mockPage, undefined, 30000);
    });

    it("should measure elapsed time", async () => {
      const startTime = Date.now();
      
      const result = await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      const endTime = Date.now();
      expect(result.meta.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(result.meta.elapsedMs).toBeLessThanOrEqual(endTime - startTime + 100); // Allow some margin
    });
  });
});
