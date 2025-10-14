import type { ScreenshotOptions } from "@visnap/protocol";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  mockPage,
  mockContext,
  mockElement,
} from "./__mocks__/playwright-core.js";
import {
  captureElementScreenshot,
  performScreenshotCapture,
} from "./screenshot-capture.js";

import type { PlaywrightAdapterOptions } from "./index.js";

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
  injectGlobalCSS: vi.fn(),
}));

// Mock the interaction-executor module
vi.mock("./interaction-executor.js", () => ({
  executeInteractions: vi.fn(),
}));

describe("screenshot-capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("captureElementScreenshot", () => {
    it("should capture screenshot of element with default selector", async () => {
      const buffer = await captureElementScreenshot(
        mockPage,
        "story-root",
        "test-case-1"
      );

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
      const buffer = await captureElementScreenshot(
        mockPage,
        ".my-component",
        "test-case-2"
      );

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
      ).rejects.toThrow(
        "Screenshot target not found with selector .not-found for case test-case-3"
      );
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

      expect(setupPage).toHaveBeenCalledWith(
        mockPage,
        mockScreenshotOptions.viewport,
        30000
      );
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
      mockPage.waitForSelector.mockRejectedValue(
        new Error("Element not found")
      );

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
      expect(result.meta.elapsedMs).toBeLessThanOrEqual(
        endTime - startTime + 100
      ); // Allow some margin
    });

    it("should inject CSS when injectCSS option is provided and not disabled", async () => {
      const { injectGlobalCSS } = await import("./browser-context.js");
      const optionsWithCSS: PlaywrightAdapterOptions = {
        ...mockOptions,
        injectCSS: "* { animation: none !important; }",
      };

      await performScreenshotCapture(
        mockContext,
        optionsWithCSS,
        mockScreenshotOptions,
        30000
      );

      expect(injectGlobalCSS).toHaveBeenCalledWith(
        mockPage,
        "* { animation: none !important; }"
      );
    });

    it("should not inject CSS when disableCSSInjection is true", async () => {
      const { injectGlobalCSS } = await import("./browser-context.js");
      const optionsWithCSS: PlaywrightAdapterOptions = {
        ...mockOptions,
        injectCSS: "* { animation: none !important; }",
      };
      const screenshotOptionsWithDisable: ScreenshotOptions = {
        ...mockScreenshotOptions,
        disableCSSInjection: true,
      };

      await performScreenshotCapture(
        mockContext,
        optionsWithCSS,
        screenshotOptionsWithDisable,
        30000
      );

      expect(injectGlobalCSS).not.toHaveBeenCalled();
    });

    it("should not inject CSS when injectCSS option is not provided", async () => {
      const { injectGlobalCSS } = await import("./browser-context.js");

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(injectGlobalCSS).not.toHaveBeenCalled();
    });

    it("should not inject CSS when injectCSS is empty string", async () => {
      const { injectGlobalCSS } = await import("./browser-context.js");
      const optionsWithEmptyCSS: PlaywrightAdapterOptions = {
        ...mockOptions,
        injectCSS: "",
      };

      await performScreenshotCapture(
        mockContext,
        optionsWithEmptyCSS,
        mockScreenshotOptions,
        30000
      );

      expect(injectGlobalCSS).not.toHaveBeenCalled();
    });

    it("should inject CSS when disableCSSInjection is false", async () => {
      const { injectGlobalCSS } = await import("./browser-context.js");
      const optionsWithCSS: PlaywrightAdapterOptions = {
        ...mockOptions,
        injectCSS: "* { transition: none !important; }",
      };
      const screenshotOptionsWithDisable: ScreenshotOptions = {
        ...mockScreenshotOptions,
        disableCSSInjection: false,
      };

      await performScreenshotCapture(
        mockContext,
        optionsWithCSS,
        screenshotOptionsWithDisable,
        30000
      );

      expect(injectGlobalCSS).toHaveBeenCalledWith(
        mockPage,
        "* { transition: none !important; }"
      );
    });

    it("should inject CSS when disableCSSInjection is undefined", async () => {
      const { injectGlobalCSS } = await import("./browser-context.js");
      const optionsWithCSS: PlaywrightAdapterOptions = {
        ...mockOptions,
        injectCSS: ".loader { display: none !important; }",
      };
      const screenshotOptionsWithoutDisable: ScreenshotOptions = {
        ...mockScreenshotOptions,
        disableCSSInjection: undefined,
      };

      await performScreenshotCapture(
        mockContext,
        optionsWithCSS,
        screenshotOptionsWithoutDisable,
        30000
      );

      expect(injectGlobalCSS).toHaveBeenCalledWith(
        mockPage,
        ".loader { display: none !important; }"
      );
    });

    it("should execute interactions when provided", async () => {
      const { executeInteractions } = await import("./interaction-executor.js");
      const screenshotOptionsWithInteractions: ScreenshotOptions = {
        ...mockScreenshotOptions,
        interactions: [
          { type: "click", selector: "button" },
          { type: "fill", selector: "input", text: "test" },
        ],
      };

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        screenshotOptionsWithInteractions,
        30000
      );

      expect(executeInteractions).toHaveBeenCalledWith(
        mockPage,
        screenshotOptionsWithInteractions.interactions,
        screenshotOptionsWithInteractions.id
      );
    });

    it("should not execute interactions when not provided", async () => {
      const { executeInteractions } = await import("./interaction-executor.js");

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        mockScreenshotOptions,
        30000
      );

      expect(executeInteractions).not.toHaveBeenCalled();
    });

    it("should not execute interactions when empty array provided", async () => {
      const { executeInteractions } = await import("./interaction-executor.js");
      const screenshotOptionsWithEmptyInteractions: ScreenshotOptions = {
        ...mockScreenshotOptions,
        interactions: [],
      };

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        screenshotOptionsWithEmptyInteractions,
        30000
      );

      expect(executeInteractions).not.toHaveBeenCalled();
    });

    it("should execute interactions before CSS injection", async () => {
      const { executeInteractions } = await import("./interaction-executor.js");
      const { injectGlobalCSS } = await import("./browser-context.js");

      const optionsWithCSS: PlaywrightAdapterOptions = {
        ...mockOptions,
        injectCSS: "* { animation: none !important; }",
      };

      const screenshotOptionsWithInteractions: ScreenshotOptions = {
        ...mockScreenshotOptions,
        interactions: [{ type: "click", selector: "button" }],
      };

      await performScreenshotCapture(
        mockContext,
        optionsWithCSS,
        screenshotOptionsWithInteractions,
        30000
      );

      // Verify both functions are called
      expect(executeInteractions).toHaveBeenCalled();
      expect(injectGlobalCSS).toHaveBeenCalled();
    });

    it("should execute interactions after waitFor", async () => {
      const { executeInteractions } = await import("./interaction-executor.js");
      const { handleWaitFor } = await import("./browser-context.js");

      const screenshotOptionsWithInteractions: ScreenshotOptions = {
        ...mockScreenshotOptions,
        interactions: [{ type: "click", selector: "button" }],
      };

      await performScreenshotCapture(
        mockContext,
        mockOptions,
        screenshotOptionsWithInteractions,
        30000
      );

      // Verify both functions are called
      expect(handleWaitFor).toHaveBeenCalled();
      expect(executeInteractions).toHaveBeenCalled();
    });

    it("should handle interaction execution errors", async () => {
      const { executeInteractions } = await import("./interaction-executor.js");
      const interactionError = new Error("Interaction failed");
      (executeInteractions as any).mockRejectedValue(interactionError);

      const screenshotOptionsWithInteractions: ScreenshotOptions = {
        ...mockScreenshotOptions,
        interactions: [{ type: "click", selector: "button" }],
      };

      await expect(
        performScreenshotCapture(
          mockContext,
          mockOptions,
          screenshotOptionsWithInteractions,
          30000
        )
      ).rejects.toThrow("Interaction failed");

      expect(executeInteractions).toHaveBeenCalledWith(
        mockPage,
        screenshotOptionsWithInteractions.interactions,
        screenshotOptionsWithInteractions.id
      );
    });
  });
});
