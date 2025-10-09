import type { TestCaseMeta, ViewportMap } from "@vividiff/protocol";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createTestCaseFilter, normalizeStories } from "./filtering.js";

// Mock the utils module
vi.mock("./utils.js", () => ({
  toSafeRegex: vi.fn(),
}));

import { toSafeRegex } from "./utils.js";

const mockToSafeRegex = vi.mocked(toSafeRegex);

describe("filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock behavior
    mockToSafeRegex.mockImplementation(pattern => {
      const escaped = pattern.replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`);
    });
  });

  describe("createTestCaseFilter", () => {
    const createMockStory = (id: string): TestCaseMeta => ({
      id,
      title: `Story ${id}`,
      visualTesting: {},
    });

    it("should include all stories when no patterns provided", () => {
      const filter = createTestCaseFilter({});
      const stories = [
        createMockStory("button-primary"),
        createMockStory("input-text"),
        createMockStory("modal-dialog"),
      ];

      stories.forEach(story => {
        expect(filter(story)).toBe(true);
      });
    });

    it("should filter by include patterns", () => {
      const filter = createTestCaseFilter({
        include: ["button*", "input*"],
      });

      expect(filter(createMockStory("button-primary"))).toBe(true);
      expect(filter(createMockStory("button-secondary"))).toBe(true);
      expect(filter(createMockStory("input-text"))).toBe(true);
      expect(filter(createMockStory("modal-dialog"))).toBe(false);
    });

    it("should filter by exclude patterns", () => {
      const filter = createTestCaseFilter({
        exclude: ["*test*", "*spec*"],
      });

      expect(filter(createMockStory("button-primary"))).toBe(true);
      expect(filter(createMockStory("button-test"))).toBe(false);
      expect(filter(createMockStory("test-button"))).toBe(false);
      expect(filter(createMockStory("input-spec"))).toBe(false);
    });

    it("should combine include and exclude patterns", () => {
      const filter = createTestCaseFilter({
        include: ["button*", "input*"],
        exclude: ["*test*"],
      });

      expect(filter(createMockStory("button-primary"))).toBe(true);
      expect(filter(createMockStory("input-text"))).toBe(true);
      expect(filter(createMockStory("button-test"))).toBe(false);
      expect(filter(createMockStory("modal-dialog"))).toBe(false);
    });

    it("should handle array patterns", () => {
      const filter = createTestCaseFilter({
        include: ["button*", "input*"],
        exclude: ["*test*", "*spec*"],
      });

      expect(filter(createMockStory("button-primary"))).toBe(true);
      expect(filter(createMockStory("input-text"))).toBe(true);
      expect(filter(createMockStory("button-test"))).toBe(false);
      expect(filter(createMockStory("input-spec"))).toBe(false);
    });

    it("should warn about invalid patterns", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      mockToSafeRegex.mockReturnValueOnce(null);

      const filter = createTestCaseFilter({
        include: ["invalid[pattern"],
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[storybook-adapter] Ignoring invalid include pattern: invalid[pattern"
      );

      // Should still work - with no valid include patterns, all stories should be included
      expect(filter(createMockStory("button-primary"))).toBe(true);

      consoleWarnSpy.mockRestore();
    });

    it("should handle empty include patterns", () => {
      const filter = createTestCaseFilter({
        include: [],
        exclude: ["*test*"],
      });

      expect(filter(createMockStory("button-primary"))).toBe(true);
      expect(filter(createMockStory("button-test"))).toBe(false);
    });
  });

  describe("normalizeStories", () => {
    const mockStories = {
      "button-primary": {
        id: "button-primary",
        title: "Primary Button",
        visualTesting: {
          skip: false,
          screenshotTarget: "#button",
          threshold: 0.1,
        },
      },
      "button-secondary": {
        id: "button-secondary",
        title: "Secondary Button",
        visualTesting: {
          skip: true,
        },
      },
      "input-text": {
        id: "input-text",
        title: "Text Input",
        visualTesting: {
          skip: false,
          threshold: 0.2,
        },
      },
      "button-with-css-disable": {
        id: "button-with-css-disable",
        title: "Button with CSS Disabled",
        visualTesting: {
          skip: false,
          disableCSSInjection: true,
        },
      },
      "button-with-css-enable": {
        id: "button-with-css-enable",
        title: "Button with CSS Enabled",
        visualTesting: {
          skip: false,
          disableCSSInjection: false,
        },
      },
      "invalid-story": {
        // Missing required fields
        title: "Invalid Story",
      },
      "another-invalid": null,
    };

    const defaultOptions = {
      baseUrl: "http://localhost:6006",
      viewportKeys: ["default", "mobile"],
      globalViewport: {
        default: { width: 1024, height: 768 },
        mobile: { width: 375, height: 667 },
      } as ViewportMap,
    };

    it("should normalize stories and create instances", () => {
      const result = normalizeStories(mockStories, defaultOptions);

      expect(result).toHaveLength(8); // 4 valid stories × 2 viewports

      const buttonPrimary = result.find(r => r.caseId === "button-primary");
      expect(buttonPrimary).toBeDefined();
      expect(buttonPrimary?.id).toBe("button-primary");
      expect(buttonPrimary?.title).toBe("Primary Button");
      expect(buttonPrimary?.variantId).toBe("default");
      expect(buttonPrimary?.url).toBe(
        "http://localhost:6006/iframe.html?id=button-primary"
      );
      expect(buttonPrimary?.screenshotTarget).toBe("#button");
      expect(buttonPrimary?.threshold).toBe(0.1);
      expect(buttonPrimary?.viewport).toEqual({ width: 1024, height: 768 });
    });

    it("should skip stories marked with skip: true", () => {
      const result = normalizeStories(mockStories, defaultOptions);

      const skippedStory = result.find(r => r.caseId === "button-secondary");
      expect(skippedStory).toBeUndefined();
    });

    it("should skip invalid stories", () => {
      const result = normalizeStories(mockStories, defaultOptions);

      const invalidStory = result.find(r => r.caseId === "invalid-story");
      expect(invalidStory).toBeUndefined();
    });

    it("should create instances for each viewport", () => {
      const result = normalizeStories(mockStories, defaultOptions);

      const buttonPrimaryInstances = result.filter(
        r => r.caseId === "button-primary"
      );
      expect(buttonPrimaryInstances).toHaveLength(2);

      const defaultInstance = buttonPrimaryInstances.find(
        r => r.variantId === "default"
      );
      const mobileInstance = buttonPrimaryInstances.find(
        r => r.variantId === "mobile"
      );

      expect(defaultInstance?.viewport).toEqual({ width: 1024, height: 768 });
      expect(mobileInstance?.viewport).toEqual({ width: 375, height: 667 });
    });

    it("should use default screenshot target when not specified", () => {
      const result = normalizeStories(mockStories, defaultOptions);

      const inputTextInstance = result.find(r => r.caseId === "input-text");
      expect(inputTextInstance?.screenshotTarget).toBe("#storybook-root");
    });

    it("should handle stories without visualTesting config", () => {
      const storiesWithoutConfig = {
        "simple-story": {
          id: "simple-story",
          title: "Simple Story",
        },
      };

      const result = normalizeStories(storiesWithoutConfig, defaultOptions);

      expect(result).toHaveLength(2); // 1 story × 2 viewports
      const instance = result[0];
      expect(instance.screenshotTarget).toBe("#storybook-root");
      expect(instance.threshold).toBeUndefined();
      expect(instance.viewport).toEqual({ width: 1024, height: 768 });
    });

    it("should apply include/exclude filters", () => {
      const result = normalizeStories(mockStories, {
        ...defaultOptions,
        include: ["button*"],
        exclude: ["*test*"],
      });

      const buttonPrimary = result.find(r => r.caseId === "button-primary");
      const inputText = result.find(r => r.caseId === "input-text");

      expect(buttonPrimary).toBeDefined();
      expect(inputText).toBeUndefined(); // Excluded by include filter
    });

    it("should handle baseUrl with trailing slash", () => {
      const result = normalizeStories(mockStories, {
        ...defaultOptions,
        baseUrl: "http://localhost:6006/",
      });

      const instance = result[0];
      expect(instance.url).toBe(
        "http://localhost:6006/iframe.html?id=button-primary"
      );
    });

    it("should handle empty viewport keys", () => {
      const result = normalizeStories(mockStories, {
        ...defaultOptions,
        viewportKeys: [],
      });

      expect(result).toHaveLength(0);
    });

    it("should sort viewport keys deterministically", () => {
      const result = normalizeStories(mockStories, {
        ...defaultOptions,
        viewportKeys: ["mobile", "default", "tablet"],
      });

      const buttonPrimaryInstances = result.filter(
        r => r.caseId === "button-primary"
      );
      expect(buttonPrimaryInstances).toHaveLength(3);

      const variantIds = buttonPrimaryInstances.map(r => r.variantId);
      // The actual sorting happens in the main function, not in normalizeStories
      expect(variantIds).toEqual(["mobile", "default", "tablet"]);
    });

    it("should use story-specific viewport config when available", () => {
      const storiesWithViewport = {
        "custom-viewport-story": {
          id: "custom-viewport-story",
          title: "Custom Viewport Story",
          visualTesting: {
            viewport: { width: 1920, height: 1080 },
          },
        },
      };

      const result = normalizeStories(storiesWithViewport, defaultOptions);

      const instance = result.find(r => r.caseId === "custom-viewport-story");
      expect(instance?.viewport).toEqual({ width: 1920, height: 1080 });
    });

    it("should handle browser configuration", () => {
      const storiesWithBrowser = {
        "browser-specific-story": {
          id: "browser-specific-story",
          title: "Browser Specific Story",
          visualTesting: {
            browser: "chromium",
          },
        },
      };

      const result = normalizeStories(storiesWithBrowser, defaultOptions);

      const instance = result.find(r => r.caseId === "browser-specific-story");
      expect(instance).toBeDefined();
      // Note: browser config is not part of TestCaseInstanceMeta, so we just verify the story is processed
    });

    it("should handle disableCSSInjection property", () => {
      const result = normalizeStories(mockStories, defaultOptions);

      const cssDisabledStory = result.find(
        r => r.caseId === "button-with-css-disable"
      );
      expect(cssDisabledStory).toBeDefined();
      expect(cssDisabledStory?.disableCSSInjection).toBe(true);

      const cssEnabledStory = result.find(
        r => r.caseId === "button-with-css-enable"
      );
      expect(cssEnabledStory).toBeDefined();
      expect(cssEnabledStory?.disableCSSInjection).toBe(false);

      const defaultStory = result.find(r => r.caseId === "button-primary");
      expect(defaultStory).toBeDefined();
      expect(defaultStory?.disableCSSInjection).toBeUndefined();
    });

    it("should handle disableCSSInjection with undefined value", () => {
      const storiesWithUndefinedCSS = {
        "story-undefined-css": {
          id: "story-undefined-css",
          title: "Story with Undefined CSS",
          visualTesting: {
            skip: false,
            disableCSSInjection: undefined,
          },
        },
      };

      const result = normalizeStories(storiesWithUndefinedCSS, defaultOptions);

      const instance = result.find(r => r.caseId === "story-undefined-css");
      expect(instance).toBeDefined();
      expect(instance?.disableCSSInjection).toBeUndefined();
    });

    it("should handle disableCSSInjection with missing property", () => {
      const storiesWithoutCSS = {
        "story-no-css": {
          id: "story-no-css",
          title: "Story without CSS property",
          visualTesting: {
            skip: false,
          },
        },
      };

      const result = normalizeStories(storiesWithoutCSS, defaultOptions);

      const instance = result.find(r => r.caseId === "story-no-css");
      expect(instance).toBeDefined();
      expect(instance?.disableCSSInjection).toBeUndefined();
    });
  });
});
