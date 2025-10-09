import { describe, it, expect } from "vitest";

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_SCREENSHOT_DIR,
  DEFAULT_THRESHOLD,
  DEFAULT_BROWSER,
  DEFAULT_SCREENSHOT_TARGET,
  STORYBOOK_READY_TIMEOUT,
  PAGE_LOAD_TIMEOUT,
  DEFAULT_CAPTURE_TIMEOUT_MS,
  DEFAULT_SERVER_PORT,
  PNG_EXTENSION,
  CONFIG_FILE_EXTENSIONS,
  STORYBOOK_SELECTORS,
  DEFAULT_DOCKER_IMAGE,
} from "./constants";

describe("constants", () => {
  describe("default values", () => {
    it("should have correct default concurrency", () => {
      expect(DEFAULT_CONCURRENCY).toBe(6);
    });

    it("should have correct default screenshot directory", () => {
      expect(DEFAULT_SCREENSHOT_DIR).toBe("vividiff");
    });

    it("should have correct default threshold", () => {
      expect(DEFAULT_THRESHOLD).toBe(0.1);
    });

    it("should have correct default browser", () => {
      expect(DEFAULT_BROWSER).toBe("chromium");
    });

    it("should have correct default screenshot target", () => {
      expect(DEFAULT_SCREENSHOT_TARGET).toBe("story-root");
    });
  });

  describe("timeouts", () => {
    it("should have correct storybook ready timeout", () => {
      expect(STORYBOOK_READY_TIMEOUT).toBe(10000);
    });

    it("should have correct page load timeout", () => {
      expect(PAGE_LOAD_TIMEOUT).toBe(30000);
    });

    it("should have correct default capture timeout", () => {
      expect(DEFAULT_CAPTURE_TIMEOUT_MS).toBe(30000);
    });
  });

  describe("server configuration", () => {
    it("should have correct default server port", () => {
      expect(DEFAULT_SERVER_PORT).toBe(4477);
    });
  });

  describe("file extensions", () => {
    it("should have correct PNG extension", () => {
      expect(PNG_EXTENSION).toBe(".png");
    });

    it("should have correct config file extensions", () => {
      expect(CONFIG_FILE_EXTENSIONS).toEqual({
        typescript: ".ts",
        javascript: ".js",
      });
    });
  });

  describe("storybook selectors", () => {
    it("should have correct storybook selectors", () => {
      expect(STORYBOOK_SELECTORS).toEqual({
        ROOT: "#storybook-root",
        BODY: "body",
      });
    });
  });

  describe("docker configuration", () => {
    it("should have correct default docker image", () => {
      expect(DEFAULT_DOCKER_IMAGE).toBe("vividiff:latest");
    });
  });
});
