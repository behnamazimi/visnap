import { describe, it, expect } from "vitest";

import {
  createMockDiscoveryConfig,
  createMockStorybookAdapterOptions,
} from "./__mocks__/mock-factories";
import { validateDiscoveryConfig, validateOptions } from "./validation";

describe("validation", () => {
  describe("validateDiscoveryConfig", () => {
    it("should validate valid discovery config", () => {
      const config = createMockDiscoveryConfig({
        evalTimeoutMs: 10000,
        maxRetries: 5,
        retryDelayMs: 1000,
      });

      const result = validateDiscoveryConfig(config);
      expect(result).toEqual(config);
    });

    it("should validate config with partial fields", () => {
      const config = {
        evalTimeoutMs: 5000,
      };

      const result = validateDiscoveryConfig(config);
      expect(result).toEqual(config);
    });

    it("should validate empty config", () => {
      const config = {};

      const result = validateDiscoveryConfig(config);
      expect(result).toEqual(config);
    });

    it("should throw error for invalid evalTimeoutMs", () => {
      const config = {
        evalTimeoutMs: -1,
      };

      expect(() => validateDiscoveryConfig(config)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for invalid maxRetries", () => {
      const config = {
        maxRetries: -1,
      };

      expect(() => validateDiscoveryConfig(config)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for invalid retryDelayMs", () => {
      const config = {
        retryDelayMs: -1,
      };

      expect(() => validateDiscoveryConfig(config)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for non-object input", () => {
      expect(() => validateDiscoveryConfig("invalid")).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for null input", () => {
      expect(() => validateDiscoveryConfig(null)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for undefined input", () => {
      expect(() => validateDiscoveryConfig(undefined)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for invalid type in evalTimeoutMs", () => {
      const config = {
        evalTimeoutMs: "not-a-number",
      };

      expect(() => validateDiscoveryConfig(config)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for invalid type in maxRetries", () => {
      const config = {
        maxRetries: "not-a-number",
      };

      expect(() => validateDiscoveryConfig(config)).toThrow(
        "Invalid discovery config:"
      );
    });

    it("should throw error for invalid type in retryDelayMs", () => {
      const config = {
        retryDelayMs: "not-a-number",
      };

      expect(() => validateDiscoveryConfig(config)).toThrow(
        "Invalid discovery config:"
      );
    });
  });

  describe("validateOptions", () => {
    it("should validate valid options", () => {
      const options = createMockStorybookAdapterOptions({
        source: "/path/to/storybook",
        port: 3000,
        include: ["button*"],
        exclude: ["*test*"],
        discovery: createMockDiscoveryConfig(),
      });

      const result = validateOptions(options);
      expect(result).toEqual(options);
    });

    it("should validate options with minimal fields", () => {
      const options = {
        source: "/path/to/storybook",
      };

      const result = validateOptions(options);
      expect(result).toEqual(options);
    });

    it("should validate options with string include/exclude", () => {
      const options = {
        source: "/path/to/storybook",
        include: "button*",
        exclude: "*test*",
      };

      const result = validateOptions(options);
      expect(result).toEqual(options);
    });

    it("should validate options with array include/exclude", () => {
      const options = {
        source: "/path/to/storybook",
        include: ["button*", "input*"],
        exclude: ["*test*", "*spec*"],
      };

      const result = validateOptions(options);
      expect(result).toEqual(options);
    });

    it("should throw error for null options", () => {
      expect(() => validateOptions(null)).toThrow(
        "Invalid storybook adapter options: must be an object (was null)"
      );
    });

    it("should throw error for undefined options", () => {
      expect(() => validateOptions(undefined)).toThrow(
        "Invalid storybook adapter options: must be an object (was undefined)"
      );
    });

    it("should throw error for non-object options", () => {
      expect(() => validateOptions("invalid")).toThrow(
        "Invalid storybook adapter options: must be an object (was a string)"
      );
    });

    it("should throw error for missing source", () => {
      const options = {};

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options: source must be a string (was missing)"
      );
    });

    it("should throw error for non-string source", () => {
      const options = {
        source: 123,
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options: source must be a string (was a number)"
      );
    });

    it("should throw error for empty source", () => {
      const options = {
        source: "",
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options: source must be non-empty"
      );
    });

    it("should throw error for whitespace-only source", () => {
      const options = {
        source: "   ",
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options: source must be non-empty"
      );
    });

    it("should throw error for invalid port type", () => {
      const options = {
        source: "/path/to/storybook",
        port: "not-a-number",
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options:"
      );
    });

    it("should throw error for negative port", () => {
      const options = {
        source: "/path/to/storybook",
        port: -1,
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options:"
      );
    });

    it("should throw error for invalid include type", () => {
      const options = {
        source: "/path/to/storybook",
        include: 123,
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options:"
      );
    });

    it("should throw error for invalid exclude type", () => {
      const options = {
        source: "/path/to/storybook",
        exclude: 123,
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options:"
      );
    });

    it("should throw error for invalid discovery config", () => {
      const options = {
        source: "/path/to/storybook",
        discovery: {
          evalTimeoutMs: -1,
        },
      };

      expect(() => validateOptions(options)).toThrow(
        "Invalid storybook adapter options:"
      );
    });

    it("should handle valid discovery config", () => {
      const options = {
        source: "/path/to/storybook",
        discovery: createMockDiscoveryConfig({
          evalTimeoutMs: 10000,
          maxRetries: 5,
          retryDelayMs: 1000,
        }),
      };

      const result = validateOptions(options);
      expect(result).toEqual(options);
    });
  });
});
