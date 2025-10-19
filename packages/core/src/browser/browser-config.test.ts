import { describe, it, expect } from "vitest";

import { parseBrowsersFromConfig, type BrowserTarget } from "./browser-config";

import { DEFAULT_BROWSER } from "@/constants";

describe("browser-config", () => {
  describe("parseBrowsersFromConfig", () => {
    it("should return default browser when no config provided", () => {
      const result = parseBrowsersFromConfig(undefined as any);
      expect(result).toEqual([{ name: DEFAULT_BROWSER }]);
    });

    it("should return default browser when browser config is missing", () => {
      const adaptersConfig = {
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([{ name: DEFAULT_BROWSER }]);
    });

    it("should return default browser when browser options are missing", () => {
      const adaptersConfig = {
        browser: { name: "chromium" },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([{ name: DEFAULT_BROWSER }]);
    });

    it("should return default browser when browser config is empty", () => {
      const adaptersConfig = {
        browser: { name: "chromium", options: {} },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([{ name: DEFAULT_BROWSER }]);
    });

    it("should parse single string browser configuration", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: "firefox",
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([{ name: "firefox" }]);
    });

    it("should parse single object browser configuration", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: {
              name: "firefox",
              options: { headless: true },
            },
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([
        {
          name: "firefox",
          options: { headless: true },
        },
      ]);
    });

    it("should parse array of string browser configurations", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: ["chromium", "firefox", "webkit"],
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([
        { name: "chromium" },
        { name: "firefox" },
        { name: "webkit" },
      ]);
    });

    it("should parse array of object browser configurations", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: [
              { name: "chromium", options: { headless: true } },
              { name: "firefox", options: { devtools: true } },
              "webkit",
            ],
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([
        { name: "chromium", options: { headless: true } },
        { name: "firefox", options: { devtools: true } },
        { name: "webkit" },
      ]);
    });

    it("should handle mixed string and object configurations", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: [
              "chromium",
              { name: "firefox", options: { headless: true } },
              "webkit",
            ],
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([
        { name: "chromium" },
        { name: "firefox", options: { headless: true } },
        { name: "webkit" },
      ]);
    });

    it("should handle empty array", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: [],
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([]);
    });

    it("should handle null browser configuration", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: null,
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([{ name: DEFAULT_BROWSER }]);
    });

    it("should handle undefined browser configuration", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: undefined,
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([{ name: DEFAULT_BROWSER }]);
    });

    it("should handle complex nested options", () => {
      const adaptersConfig = {
        browser: {
          name: "chromium",
          options: {
            browser: {
              name: "firefox",
              options: {
                headless: true,
                args: ["--no-sandbox", "--disable-dev-shm-usage"],
                viewport: { width: 1920, height: 1080 },
              },
            },
          },
        },
        testCase: [{ name: "storybook" }],
      };

      const result = parseBrowsersFromConfig(adaptersConfig as any);
      expect(result).toEqual([
        {
          name: "firefox",
          options: {
            headless: true,
            args: ["--no-sandbox", "--disable-dev-shm-usage"],
            viewport: { width: 1920, height: 1080 },
          },
        },
      ]);
    });
  });

  describe("BrowserTarget type", () => {
    it("should accept valid BrowserTarget objects", () => {
      const validTargets: BrowserTarget[] = [
        { name: "chromium" },
        { name: "firefox", options: { headless: true } },
        { name: "webkit", options: { devtools: true } },
      ];

      expect(validTargets).toBeDefined();
    });

    it("should accept BrowserTarget with empty options", () => {
      const target: BrowserTarget = {
        name: "chromium",
        options: {},
      };

      expect(target).toBeDefined();
    });
  });
});
