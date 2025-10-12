import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ImageHandler } from "./image-handler";
import type { TestCaseDetail } from "@vividiff/protocol";

describe("ImageHandler", () => {
  let imageHandler: ImageHandler;
  let mockTestCases: TestCaseDetail[];

  beforeEach(() => {
    imageHandler = new ImageHandler();
    mockTestCases = [
      {
        id: "test-1",
        title: "Test 1",
        status: "passed",
        captureFilename: "test-1.png",
        totalDurationMs: 500,
        browser: "chromium",
        viewport: { width: 1920, height: 1080 },
      } as TestCaseDetail,
      {
        id: "test-2",
        title: "Test 2",
        status: "failed",
        captureFilename: "test-2.png",
        totalDurationMs: 1000,
        reason: "pixel-diff",
        diffPercentage: 5.2,
        browser: "firefox",
        viewport: { width: 1280, height: 720 },
      } as TestCaseDetail,
    ];
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getRelativeImagePaths", () => {
    it("should generate correct relative paths for passed test", async () => {
      const testCase = mockTestCases[0]; // passed test
      const screenshotDir = "./vividiff";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-1.png",
        current: "current/test-1.png",
        diff: undefined,
      });
    });

    it("should generate correct relative paths for failed test", async () => {
      const testCase = mockTestCases[1]; // failed test
      const screenshotDir = "./vividiff";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-2.png",
        current: "current/test-2.png",
        diff: "diff/test-2.png",
      });
    });

    it("should handle different screenshot directories", async () => {
      const testCase = mockTestCases[0];
      const screenshotDir = "/custom/path/screenshots";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-1.png",
        current: "current/test-1.png",
        diff: undefined,
      });
    });

    it("should handle different file extensions", async () => {
      const testCase = {
        ...mockTestCases[0],
        captureFilename: "test-1.jpg",
      };
      const screenshotDir = "./vividiff";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-1.jpg",
        current: "current/test-1.jpg",
        diff: undefined,
      });
    });

    it("should not include diff image for non-pixel-diff failures", async () => {
      const testCase = {
        ...mockTestCases[1],
        reason: "missing-base",
      };
      const screenshotDir = "./vividiff";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-2.png",
        current: "current/test-2.png",
        diff: undefined,
      });
    });

    it("should include diff image only for pixel-diff failures", async () => {
      const testCase = {
        ...mockTestCases[1],
        reason: "pixel-diff",
      };
      const screenshotDir = "./vividiff";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-2.png",
        current: "current/test-2.png",
        diff: "diff/test-2.png",
      });
    });

    it("should handle empty screenshot directory", async () => {
      const testCase = mockTestCases[0];
      const screenshotDir = "";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-1.png",
        current: "current/test-1.png",
        diff: undefined,
      });
    });

    it("should handle test cases with special characters in filename", async () => {
      const testCase = {
        ...mockTestCases[0],
        captureFilename: "test-with-special-chars_123.png",
      };
      const screenshotDir = "./vividiff";

      const result = await imageHandler.getRelativeImagePaths(testCase, screenshotDir);

      expect(result).toEqual({
        base: "base/test-with-special-chars_123.png",
        current: "current/test-with-special-chars_123.png",
        diff: undefined,
      });
    });
  });
});
