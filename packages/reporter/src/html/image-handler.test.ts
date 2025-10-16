import type { TestCaseDetail } from "@visnap/protocol";
import { describe, it, expect, beforeEach } from "vitest";

import { ImageHandler } from "./image-handler";

describe("ImageHandler", () => {
  let imageHandler: ImageHandler;

  beforeEach(() => {
    imageHandler = new ImageHandler();
  });

  describe("getRelativeImagePaths", () => {
    it("should generate correct image paths for a test case", async () => {
      const testCase: TestCaseDetail = {
        id: "test-1",
        status: "passed",
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "test-1.png",
        captureDurationMs: 1000,
        totalDurationMs: 1000,
      };

      const result = await imageHandler.getRelativeImagePaths(
        testCase,
        "/screenshots"
      );

      expect(result).toEqual({
        base: "base/test-1.png",
        current: "current/test-1.png",
        diff: undefined,
      });
    });

    it("should include diff image path for failed pixel-diff test cases", async () => {
      const testCase: TestCaseDetail = {
        id: "test-1",
        status: "failed",
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "test-1.png",
        captureDurationMs: 1000,
        totalDurationMs: 1000,
        reason: "pixel-diff",
      };

      const result = await imageHandler.getRelativeImagePaths(
        testCase,
        "/screenshots"
      );

      expect(result).toEqual({
        base: "base/test-1.png",
        current: "current/test-1.png",
        diff: "diff/test-1.png",
      });
    });

    it("should not include diff image path for failed test cases without pixel-diff reason", async () => {
      const testCase: TestCaseDetail = {
        id: "test-1",
        status: "failed",
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "test-1.png",
        captureDurationMs: 1000,
        totalDurationMs: 1000,
        reason: "timeout",
      };

      const result = await imageHandler.getRelativeImagePaths(
        testCase,
        "/screenshots"
      );

      expect(result).toEqual({
        base: "base/test-1.png",
        current: "current/test-1.png",
        diff: undefined,
      });
    });

    it("should handle different capture filenames", async () => {
      const testCase: TestCaseDetail = {
        id: "test-1",
        status: "passed",
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "my-special-test-screenshot.jpg",
        captureDurationMs: 1000,
        totalDurationMs: 1000,
      };

      const result = await imageHandler.getRelativeImagePaths(
        testCase,
        "/screenshots"
      );

      expect(result).toEqual({
        base: "base/my-special-test-screenshot.jpg",
        current: "current/my-special-test-screenshot.jpg",
        diff: undefined,
      });
    });
  });

  describe("processTestCases", () => {
    it("should process multiple test cases with correct image paths", () => {
      const testCases: TestCaseDetail[] = [
        {
          id: "test-1",
          status: "passed",
          browser: "chrome",
          viewport: "1920x1080",
          captureFilename: "test-1.png",
          captureDurationMs: 1000,
          totalDurationMs: 1000,
        },
        {
          id: "test-2",
          status: "failed",
          browser: "firefox",
          viewport: "1366x768",
          captureFilename: "test-2.png",
          captureDurationMs: 2000,
          totalDurationMs: 2000,
          reason: "pixel-diff",
        },
        {
          id: "test-3",
          status: "capture-failed",
          browser: "safari",
          viewport: "1024x768",
          captureFilename: "test-3.png",
          captureDurationMs: 0,
          totalDurationMs: 0,
        },
      ];

      const result = imageHandler.processTestCases(testCases);

      expect(result).toHaveLength(3);

      // Check first test case (passed)
      expect(result[0]).toEqual({
        ...testCases[0],
        baseImage: "./base/test-1.png",
        currentImage: "./current/test-1.png",
        diffImage: undefined,
      });

      // Check second test case (failed with pixel-diff)
      expect(result[1]).toEqual({
        ...testCases[1],
        baseImage: "./base/test-2.png",
        currentImage: "./current/test-2.png",
        diffImage: "./diff/test-2.png",
      });

      // Check third test case (skipped)
      expect(result[2]).toEqual({
        ...testCases[2],
        baseImage: "./base/test-3.png",
        currentImage: "./current/test-3.png",
        diffImage: undefined,
      });
    });

    it("should handle empty test cases array", () => {
      const result = imageHandler.processTestCases([]);
      expect(result).toEqual([]);
    });

    it("should only add diff image for failed test cases", () => {
      const testCases: TestCaseDetail[] = [
        {
          id: "test-1",
          status: "passed",
          browser: "chrome",
          viewport: "1920x1080",
          captureFilename: "test-1.png",
          captureDurationMs: 1000,
          totalDurationMs: 1000,
        },
        {
          id: "test-2",
          status: "failed",
          browser: "chrome",
          viewport: "1920x1080",
          captureFilename: "test-2.png",
          captureDurationMs: 1000,
          totalDurationMs: 1000,
          reason: "timeout", // Not pixel-diff
        },
        {
          id: "test-3",
          status: "failed",
          browser: "chrome",
          viewport: "1920x1080",
          captureFilename: "test-3.png",
          captureDurationMs: 1000,
          totalDurationMs: 1000,
          reason: "pixel-diff",
        },
      ];

      const result = imageHandler.processTestCases(testCases);

      expect(result[0].diffImage).toBeUndefined();
      expect(result[1].diffImage).toBeUndefined(); // timeout reason, not pixel-diff
      expect(result[2].diffImage).toBe("./diff/test-3.png");
    });

    it("should preserve all original test case properties", () => {
      const testCase: TestCaseDetail = {
        id: "test-1",
        status: "passed",
        browser: "chrome",
        viewport: "1920x1080",
        captureFilename: "test-1.png",
        captureDurationMs: 1500,
        totalDurationMs: 1500,
        reason: "success",
      };

      const result = imageHandler.processTestCases([testCase]);

      expect(result[0]).toEqual({
        ...testCase,
        baseImage: "./base/test-1.png",
        currentImage: "./current/test-1.png",
        diffImage: undefined,
      });
    });
  });
});
