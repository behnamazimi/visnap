import { describe, it, expect } from "vitest";

import {
  VTTError,
  ConfigError,
  BrowserError,
  TestCaseError,
  ScreenshotError,
  getErrorMessage,
} from "./error-handler";

describe("error-handler", () => {
  describe("VTTError", () => {
    it("should create VTTError with message and code", () => {
      const error = new VTTError("Test error", "TEST_CODE");

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("VTTError");
      expect(error.originalError).toBeUndefined();
    });

    it("should create VTTError with original error", () => {
      const originalError = new Error("Original error");
      const error = new VTTError("Test error", "TEST_CODE", originalError);

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.name).toBe("VTTError");
      expect(error.originalError).toBe(originalError);
    });
  });

  describe("ConfigError", () => {
    it("should create ConfigError with correct properties", () => {
      const error = new ConfigError("Config error");

      expect(error.message).toBe("Config error");
      expect(error.code).toBe("CONFIG_ERROR");
      expect(error.name).toBe("ConfigError");
    });

    it("should create ConfigError with original error", () => {
      const originalError = new Error("Original error");
      const error = new ConfigError("Config error", originalError);

      expect(error.message).toBe("Config error");
      expect(error.code).toBe("CONFIG_ERROR");
      expect(error.name).toBe("ConfigError");
      expect(error.originalError).toBe(originalError);
    });
  });

  describe("BrowserError", () => {
    it("should create BrowserError with correct properties", () => {
      const error = new BrowserError("Browser error");

      expect(error.message).toBe("Browser error");
      expect(error.code).toBe("BROWSER_ERROR");
      expect(error.name).toBe("BrowserError");
    });
  });

  describe("TestCaseError", () => {
    it("should create TestCaseError with correct properties", () => {
      const error = new TestCaseError("Test case error");

      expect(error.message).toBe("Test case error");
      expect(error.code).toBe("TEST_CASE_ERROR");
      expect(error.name).toBe("TestCaseError");
    });
  });

  describe("ScreenshotError", () => {
    it("should create ScreenshotError with correct properties", () => {
      const error = new ScreenshotError("Screenshot error");

      expect(error.message).toBe("Screenshot error");
      expect(error.code).toBe("SCREENSHOT_ERROR");
      expect(error.name).toBe("ScreenshotError");
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error instance", () => {
      const error = new Error("Test error message");
      expect(getErrorMessage(error)).toBe("Test error message");
    });

    it("should return string as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("should return default message for unknown error types", () => {
      expect(getErrorMessage(null)).toBe("Unknown error");
      expect(getErrorMessage(undefined)).toBe("Unknown error");
      expect(getErrorMessage(123)).toBe("Unknown error");
      expect(getErrorMessage({})).toBe("Unknown error");
    });
  });
});
