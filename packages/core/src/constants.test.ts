import { describe, it, expect } from "vitest";

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_SCREENSHOT_DIR,
  DEFAULT_THRESHOLD,
  DEFAULT_BROWSER,
  DEFAULT_CAPTURE_TIMEOUT_MS,
  CONFIG_FILE_EXTENSIONS,
  DEFAULT_DOCKER_IMAGE,
} from "./constants";

describe("constants", () => {
  describe("default values", () => {
    it("should have correct default concurrency", () => {
      expect(DEFAULT_CONCURRENCY).toBe(6);
    });

    it("should have correct default screenshot directory", () => {
      expect(DEFAULT_SCREENSHOT_DIR).toBe("visnap");
    });

    it("should have correct default threshold", () => {
      expect(DEFAULT_THRESHOLD).toBe(0.1);
    });

    it("should have correct default browser", () => {
      expect(DEFAULT_BROWSER).toBe("chromium");
    });
  });

  describe("timeouts", () => {
    it("should have correct default capture timeout", () => {
      expect(DEFAULT_CAPTURE_TIMEOUT_MS).toBe(30000);
    });
  });

  describe("file extensions", () => {
    it("should have correct config file extensions", () => {
      expect(CONFIG_FILE_EXTENSIONS).toEqual({
        typescript: ".ts",
        javascript: ".js",
      });
    });
  });

  describe("docker configuration", () => {
    it("should have correct default docker image", () => {
      expect(DEFAULT_DOCKER_IMAGE).toBe("visnap/visnap:latest");
    });
  });
});
