import { type } from "arktype";
import { describe, it, expect } from "vitest";

import {
  validateLaunchOptions,
  validateContextOptions,
  validateNavigationOptions,
  validatePerformanceOptions,
  validateOptions,
  browserNameSchema,
  launchOptionsSchema,
  contextOptionsSchema,
  navigationOptionsSchema,
  performanceOptionsSchema,
  playwrightAdapterOptionsSchema,
} from "./validation";

describe("validation", () => {
  describe("browserNameSchema", () => {
    it("should accept valid browser names", () => {
      expect(browserNameSchema("chromium")).toBe("chromium");
      expect(browserNameSchema("firefox")).toBe("firefox");
      expect(browserNameSchema("webkit")).toBe("webkit");
      expect(browserNameSchema("custom-browser")).toBe("custom-browser");
    });

    it("should reject invalid browser names", () => {
      expect(browserNameSchema(123)).toBeInstanceOf(type.errors);
      expect(browserNameSchema(null)).toBeInstanceOf(type.errors);
      expect(browserNameSchema(undefined)).toBeInstanceOf(type.errors);
      expect(browserNameSchema({})).toBeInstanceOf(type.errors);
    });
  });

  describe("launchOptionsSchema", () => {
    it("should accept valid launch options", () => {
      const validOptions = {
        browser: "chromium",
        headless: true,
        channel: "chrome",
      };
      expect(launchOptionsSchema(validOptions)).toEqual(validOptions);
    });

    it("should accept partial launch options", () => {
      const partialOptions = {
        browser: "firefox",
      };
      expect(launchOptionsSchema(partialOptions)).toEqual(partialOptions);
    });

    it("should reject empty object (browser is required)", () => {
      expect(launchOptionsSchema({})).toBeInstanceOf(type.errors);
    });

    it("should reject invalid browser name", () => {
      const invalidOptions = {
        browser: 123,
        headless: true,
      };
      expect(launchOptionsSchema(invalidOptions)).toBeInstanceOf(type.errors);
    });

    it("should reject invalid headless value", () => {
      const invalidOptions = {
        browser: "chromium",
        headless: "yes",
      };
      expect(launchOptionsSchema(invalidOptions)).toBeInstanceOf(type.errors);
    });

    it("should reject invalid channel value", () => {
      const invalidOptions = {
        browser: "chromium",
        channel: 123,
      };
      expect(launchOptionsSchema(invalidOptions)).toBeInstanceOf(type.errors);
    });
  });

  describe("contextOptionsSchema", () => {
    it("should accept valid context options", () => {
      const validOptions = {
        colorScheme: "dark",
        reducedMotion: "no-preference",
        storageStatePath: "/path/to/storage.json",
      };
      expect(contextOptionsSchema(validOptions)).toEqual(validOptions);
    });

    it("should accept partial context options", () => {
      const partialOptions = {
        colorScheme: "light",
      };
      expect(contextOptionsSchema(partialOptions)).toEqual(partialOptions);
    });

    it("should accept empty object", () => {
      expect(contextOptionsSchema({})).toEqual({});
    });

    it("should reject invalid colorScheme", () => {
      const invalidOptions = {
        colorScheme: "invalid",
      };
      expect(contextOptionsSchema(invalidOptions)).toBeInstanceOf(type.errors);
    });

    it("should reject invalid reducedMotion", () => {
      const invalidOptions = {
        reducedMotion: "invalid",
      };
      expect(contextOptionsSchema(invalidOptions)).toBeInstanceOf(type.errors);
    });

    it("should reject invalid storageStatePath", () => {
      const invalidOptions = {
        storageStatePath: 123,
      };
      expect(contextOptionsSchema(invalidOptions)).toBeInstanceOf(type.errors);
    });
  });

  describe("navigationOptionsSchema", () => {
    it("should accept valid navigation options", () => {
      const validOptions = {
        baseUrl: "https://example.com",
        waitUntil: "networkidle",
        timeoutMs: 30000,
      };
      expect(navigationOptionsSchema(validOptions)).toEqual(validOptions);
    });

    it("should accept partial navigation options", () => {
      const partialOptions = {
        baseUrl: "https://test.com",
      };
      expect(navigationOptionsSchema(partialOptions)).toEqual(partialOptions);
    });

    it("should accept empty object", () => {
      expect(navigationOptionsSchema({})).toEqual({});
    });

    it("should reject invalid waitUntil", () => {
      const invalidOptions = {
        waitUntil: "invalid",
      };
      expect(navigationOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });

    it("should reject invalid timeoutMs", () => {
      const invalidOptions = {
        timeoutMs: -1000,
      };
      expect(navigationOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });

    it("should reject zero timeoutMs", () => {
      const invalidOptions = {
        timeoutMs: 0,
      };
      expect(navigationOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });

    it("should reject invalid baseUrl", () => {
      const invalidOptions = {
        baseUrl: 123,
      };
      expect(navigationOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });
  });

  describe("performanceOptionsSchema", () => {
    it("should accept valid performance options", () => {
      const validOptions = {
        blockResources: [".map", ".mp4", "fonts.gstatic.com"],
        reuseContext: true,
        disableAnimations: false,
      };
      expect(performanceOptionsSchema(validOptions)).toEqual(validOptions);
    });

    it("should accept partial performance options", () => {
      const partialOptions = {
        blockResources: [".map"],
      };
      expect(performanceOptionsSchema(partialOptions)).toEqual(partialOptions);
    });

    it("should accept empty object", () => {
      expect(performanceOptionsSchema({})).toEqual({});
    });

    it("should reject invalid blockResources", () => {
      const invalidOptions = {
        blockResources: "not-an-array",
      };
      expect(performanceOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });

    it("should reject invalid reuseContext", () => {
      const invalidOptions = {
        reuseContext: "yes",
      };
      expect(performanceOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });

    it("should reject invalid disableAnimations", () => {
      const invalidOptions = {
        disableAnimations: "yes",
      };
      expect(performanceOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });
  });

  describe("playwrightAdapterOptionsSchema", () => {
    it("should accept valid adapter options", () => {
      const validOptions = {
        launch: {
          browser: "chromium",
          headless: true,
        },
        context: {
          colorScheme: "light",
          reducedMotion: "reduce",
        },
        navigation: {
          baseUrl: "https://example.com",
          waitUntil: "load",
          timeoutMs: 30000,
        },
        injectCSS: "* { animation: none !important; }",
        performance: {
          blockResources: [".map"],
          reuseContext: false,
          disableAnimations: true,
        },
      };
      expect(playwrightAdapterOptionsSchema(validOptions)).toEqual(
        validOptions
      );
    });

    it("should accept empty object", () => {
      expect(playwrightAdapterOptionsSchema({})).toEqual({});
    });

    it("should reject invalid nested options", () => {
      const invalidOptions = {
        launch: {
          browser: 123,
        },
      };
      expect(playwrightAdapterOptionsSchema(invalidOptions)).toBeInstanceOf(
        type.errors
      );
    });
  });

  describe("validateLaunchOptions", () => {
    it("should return validated options for valid input", () => {
      const options = {
        browser: "chromium",
        headless: true,
        channel: "chrome",
      };
      expect(validateLaunchOptions(options)).toEqual(options);
    });

    it("should throw error for invalid input", () => {
      const invalidOptions = {
        browser: 123,
        headless: true,
      };
      expect(() => validateLaunchOptions(invalidOptions)).toThrow(
        "Invalid launch options:"
      );
    });
  });

  describe("validateContextOptions", () => {
    it("should return validated options for valid input", () => {
      const options = {
        colorScheme: "dark",
        reducedMotion: "no-preference",
        storageStatePath: "/path/to/storage.json",
      };
      expect(validateContextOptions(options)).toEqual(options);
    });

    it("should throw error for invalid input", () => {
      const invalidOptions = {
        colorScheme: "invalid",
      };
      expect(() => validateContextOptions(invalidOptions)).toThrow(
        "Invalid context options:"
      );
    });
  });

  describe("validateNavigationOptions", () => {
    it("should return validated options for valid input", () => {
      const options = {
        baseUrl: "https://example.com",
        waitUntil: "networkidle",
        timeoutMs: 30000,
      };
      expect(validateNavigationOptions(options)).toEqual(options);
    });

    it("should throw error for invalid input", () => {
      const invalidOptions = {
        waitUntil: "invalid",
      };
      expect(() => validateNavigationOptions(invalidOptions)).toThrow(
        "Invalid navigation options:"
      );
    });
  });

  describe("validatePerformanceOptions", () => {
    it("should return validated options for valid input", () => {
      const options = {
        blockResources: [".map", ".mp4"],
        reuseContext: true,
        disableAnimations: false,
      };
      expect(validatePerformanceOptions(options)).toEqual(options);
    });

    it("should throw error for invalid input", () => {
      const invalidOptions = {
        blockResources: "not-an-array",
      };
      expect(() => validatePerformanceOptions(invalidOptions)).toThrow(
        "Invalid performance options:"
      );
    });
  });

  describe("validateOptions", () => {
    it("should return validated options for valid input", () => {
      const options = {
        launch: {
          browser: "chromium",
          headless: true,
        },
        context: {
          colorScheme: "light",
        },
        navigation: {
          baseUrl: "https://example.com",
        },
        injectCSS: "* { animation: none !important; }",
        performance: {
          blockResources: [".map"],
          reuseContext: false,
          disableAnimations: true,
        },
      };
      expect(validateOptions(options)).toEqual(options);
    });

    it("should return validated options for empty input", () => {
      expect(validateOptions({})).toEqual({});
    });

    it("should throw error for invalid input", () => {
      const invalidOptions = {
        launch: {
          browser: 123,
        },
      };
      expect(() => validateOptions(invalidOptions)).toThrow(
        "Invalid playwright adapter options:"
      );
    });

    it("should throw error for null input", () => {
      expect(() => validateOptions(null)).toThrow(
        "Invalid playwright adapter options:"
      );
    });

    it("should throw error for undefined input", () => {
      expect(() => validateOptions(undefined)).toThrow(
        "Invalid playwright adapter options:"
      );
    });
  });
});
