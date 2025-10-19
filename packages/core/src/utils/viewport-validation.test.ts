import { describe, it, expect } from "vitest";

import {
  validateViewport,
  createSafeViewport,
  DEFAULT_VIEWPORT,
  MIN_VIEWPORT_DIMENSION,
  MAX_VIEWPORT_DIMENSION,
  MIN_DEVICE_SCALE_FACTOR,
  MAX_DEVICE_SCALE_FACTOR,
} from "./viewport-validation";

describe("viewport-validation", () => {
  describe("validateViewport", () => {
    it("should validate a valid viewport", () => {
      const viewport = { width: 1920, height: 1080 };
      const result = validateViewport(viewport);

      expect(result).toEqual(viewport);
    });

    it("should validate viewport with deviceScaleFactor", () => {
      const viewport = { width: 1920, height: 1080, deviceScaleFactor: 2 };
      const result = validateViewport(viewport);

      expect(result).toEqual(viewport);
    });

    it("should reject non-object input", () => {
      expect(() => validateViewport(null)).toThrow(
        "viewport must be an object"
      );
      expect(() => validateViewport(undefined)).toThrow(
        "viewport must be an object"
      );
      expect(() => validateViewport("string")).toThrow(
        "viewport must be an object"
      );
      expect(() => validateViewport(123)).toThrow("viewport must be an object");
    });

    it("should reject empty object", () => {
      expect(() => validateViewport({})).toThrow(
        "viewport.width must be an integer"
      );
    });

    it("should validate width as integer", () => {
      expect(() => validateViewport({ width: "1920" })).toThrow(
        "viewport.width must be an integer"
      );
      expect(() => validateViewport({ width: 1920.5 })).toThrow(
        "viewport.width must be an integer"
      );
      expect(() => validateViewport({ width: null })).toThrow(
        "viewport.width must be an integer"
      );
    });

    it("should validate width bounds", () => {
      expect(() => validateViewport({ width: 0 })).toThrow(
        `viewport.width must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
      );
      expect(() => validateViewport({ width: -1 })).toThrow(
        `viewport.width must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
      );
      expect(() => validateViewport({ width: 10001 })).toThrow(
        `viewport.width must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
      );
    });

    it("should validate height as integer", () => {
      expect(() => validateViewport({ width: 1920, height: "1080" })).toThrow(
        "viewport.height must be an integer"
      );
      expect(() => validateViewport({ width: 1920, height: 1080.5 })).toThrow(
        "viewport.height must be an integer"
      );
      expect(() => validateViewport({ width: 1920, height: null })).toThrow(
        "viewport.height must be an integer"
      );
    });

    it("should validate height bounds", () => {
      expect(() => validateViewport({ width: 1920, height: 0 })).toThrow(
        `viewport.height must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
      );
      expect(() => validateViewport({ width: 1920, height: -1 })).toThrow(
        `viewport.height must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
      );
      expect(() => validateViewport({ width: 1920, height: 10001 })).toThrow(
        `viewport.height must be between ${MIN_VIEWPORT_DIMENSION} and ${MAX_VIEWPORT_DIMENSION}`
      );
    });

    it("should validate deviceScaleFactor as number", () => {
      expect(() =>
        validateViewport({ width: 1920, height: 1080, deviceScaleFactor: "2" })
      ).toThrow("viewport.deviceScaleFactor must be a number");
      expect(() =>
        validateViewport({ width: 1920, height: 1080, deviceScaleFactor: null })
      ).toThrow("viewport.deviceScaleFactor must be a number");
    });

    it("should validate deviceScaleFactor bounds", () => {
      expect(() =>
        validateViewport({ width: 1920, height: 1080, deviceScaleFactor: 0.05 })
      ).toThrow(
        `viewport.deviceScaleFactor must be between ${MIN_DEVICE_SCALE_FACTOR} and ${MAX_DEVICE_SCALE_FACTOR}`
      );
      expect(() =>
        validateViewport({ width: 1920, height: 1080, deviceScaleFactor: 11 })
      ).toThrow(
        `viewport.deviceScaleFactor must be between ${MIN_DEVICE_SCALE_FACTOR} and ${MAX_DEVICE_SCALE_FACTOR}`
      );
    });

    it("should accept valid deviceScaleFactor values", () => {
      const viewport1 = { width: 1920, height: 1080, deviceScaleFactor: 0.1 };
      const viewport2 = { width: 1920, height: 1080, deviceScaleFactor: 10 };
      const viewport3 = { width: 1920, height: 1080, deviceScaleFactor: 2.5 };

      expect(validateViewport(viewport1)).toEqual(viewport1);
      expect(validateViewport(viewport2)).toEqual(viewport2);
      expect(validateViewport(viewport3)).toEqual(viewport3);
    });

    it("should use custom context in error messages", () => {
      expect(() =>
        validateViewport({ width: "1920" }, "customViewport")
      ).toThrow("customViewport.width must be an integer");
    });

    it("should handle edge case dimensions", () => {
      const minViewport = {
        width: MIN_VIEWPORT_DIMENSION,
        height: MIN_VIEWPORT_DIMENSION,
      };
      const maxViewport = {
        width: MAX_VIEWPORT_DIMENSION,
        height: MAX_VIEWPORT_DIMENSION,
      };

      expect(validateViewport(minViewport)).toEqual(minViewport);
      expect(validateViewport(maxViewport)).toEqual(maxViewport);
    });
  });

  describe("createSafeViewport", () => {
    it("should return fallback for undefined input", () => {
      const fallback = { width: 800, height: 600 };
      const result = createSafeViewport(undefined, fallback);

      expect(result).toEqual(fallback);
    });

    it("should return fallback for null input", () => {
      const fallback = { width: 800, height: 600 };
      const result = createSafeViewport(null, fallback);

      expect(result).toEqual(fallback);
    });

    it("should return default fallback when none provided", () => {
      const result = createSafeViewport(undefined);

      expect(result).toEqual(DEFAULT_VIEWPORT);
    });

    it("should validate and return valid viewport", () => {
      const viewport = { width: 1920, height: 1080, deviceScaleFactor: 2 };
      const result = createSafeViewport(viewport);

      expect(result).toEqual(viewport);
    });

    it("should throw error for invalid viewport", () => {
      const invalidViewport = { width: "1920" };

      expect(() => createSafeViewport(invalidViewport)).toThrow(
        "Invalid viewport: viewport.width must be an integer"
      );
    });

    it("should use custom context in error messages", () => {
      const invalidViewport = { width: "1920" };

      expect(() =>
        createSafeViewport(invalidViewport, DEFAULT_VIEWPORT, "customViewport")
      ).toThrow(
        "Invalid customViewport: customViewport.width must be an integer"
      );
    });

    it("should handle error objects in error messages", () => {
      const invalidViewport = { width: "1920" };

      // Test with a custom error message that includes non-Error object
      expect(() => createSafeViewport(invalidViewport)).toThrow(
        "Invalid viewport: viewport.width must be an integer"
      );
    });
  });

  describe("constants", () => {
    it("should have correct default viewport", () => {
      expect(DEFAULT_VIEWPORT).toEqual({ width: 1920, height: 1080 });
    });

    it("should have correct dimension bounds", () => {
      expect(MIN_VIEWPORT_DIMENSION).toBe(1);
      expect(MAX_VIEWPORT_DIMENSION).toBe(10000);
    });

    it("should have correct device scale factor bounds", () => {
      expect(MIN_DEVICE_SCALE_FACTOR).toBe(0.1);
      expect(MAX_DEVICE_SCALE_FACTOR).toBe(10);
    });
  });
});
