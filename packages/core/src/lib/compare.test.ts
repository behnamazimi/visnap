import { readdirSync } from "fs";
import { join } from "path";

import odiff from "odiff-bin";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  compareDirectories,
  compareBaseAndCurrentWithTestCases,
} from "./compare";

import { getErrorMessage } from "@/utils/error-handler";

// Mock dependencies
vi.mock("fs", () => ({
  readdirSync: vi.fn(),
}));

vi.mock("odiff-bin", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/utils/error-handler", () => ({
  getErrorMessage: vi.fn(),
}));

vi.mock("../../utils/fs", () => ({
  getCurrentDir: vi.fn(() => "/test/current"),
  getBaseDir: vi.fn(() => "/test/base"),
  getDiffDir: vi.fn(() => "/test/diff"),
}));

describe("compare", () => {
  const mockReaddirSync = vi.mocked(readdirSync);
  const mockOdiffCompare = vi.mocked(odiff.compare);
  const mockGetErrorMessage = vi.mocked(getErrorMessage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("compareDirectories", () => {
    it("should compare files and return match results", async () => {
      mockReaddirSync
        .mockReturnValueOnce(["file1.png", "file2.png"] as any)
        .mockReturnValueOnce(["file1.png", "file2.png"] as any);

      mockOdiffCompare
        .mockResolvedValueOnce({ match: true })
        .mockResolvedValueOnce({
          match: false,
          reason: "pixel-diff",
          diffCount: 100,
          diffPercentage: 5.2,
        });

      const result = await compareDirectories("/current", "/base", "/diff");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: true,
        reason: "",
        diffPercentage: 0,
      });
      expect(result[1]).toEqual({
        id: "file2.png",
        match: false,
        reason: "pixel-diff",
        diffPercentage: 5.2,
      });
    });

    it("should handle missing files in current directory", async () => {
      mockReaddirSync
        .mockReturnValueOnce(["file1.png"] as any)
        .mockReturnValueOnce(["file1.png", "file2.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      const result = await compareDirectories("/current", "/base", "/diff");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: true,
        reason: "",
        diffPercentage: 0,
      });
      expect(result[1]).toEqual({
        id: "file2.png",
        match: false,
        reason: "missing-current",
      });
    });

    it("should handle missing files in base directory", async () => {
      mockReaddirSync
        .mockReturnValueOnce(["file1.png", "file2.png"] as any)
        .mockReturnValueOnce(["file1.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      const result = await compareDirectories("/current", "/base", "/diff");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: true,
        reason: "",
        diffPercentage: 0,
      });
      expect(result[1]).toEqual({
        id: "file2.png",
        match: false,
        reason: "missing-base",
      });
    });

    it("should use custom threshold and diff color", async () => {
      mockReaddirSync
        .mockReturnValueOnce(["file1.png"] as any)
        .mockReturnValueOnce(["file1.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      await compareDirectories("/current", "/base", "/diff", {
        threshold: 0.2,
        diffColor: "#ff0000",
      });

      expect(mockOdiffCompare).toHaveBeenCalledWith(
        join("/current", "file1.png"),
        join("/base", "file1.png"),
        join("/diff", "file1.png"),
        {
          threshold: 0.2,
          diffColor: "#ff0000",
        }
      );
    });

    it("should handle odiff errors", async () => {
      mockReaddirSync
        .mockReturnValueOnce(["file1.png"] as any)
        .mockReturnValueOnce(["file1.png"] as any);

      const error = new Error(
        "Could not load comparison image: /base/file1.png"
      );
      mockOdiffCompare.mockRejectedValueOnce(error);
      mockGetErrorMessage.mockReturnValue(
        "Could not load comparison image: /base/file1.png"
      );

      const result = await compareDirectories("/current", "/base", "/diff");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "missing-base",
      });
    });

    it("should handle generic odiff errors", async () => {
      mockReaddirSync
        .mockReturnValueOnce(["file1.png"] as any)
        .mockReturnValueOnce(["file1.png"] as any);

      const error = new Error("Generic error");
      mockOdiffCompare.mockRejectedValueOnce(error);
      mockGetErrorMessage.mockReturnValue("Generic error");

      const result = await compareDirectories("/current", "/base", "/diff");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "error",
      });
    });
  });

  describe("compareBaseAndCurrentWithTestCases", () => {
    const mockConfig = {
      screenshotDir: "test-dir",
      threshold: 0.1,
      adapters: {
        browser: { name: "playwright" },
        testCase: [{ name: "storybook" }],
      },
    };

    const mockTestCases = [
      { caseId: "story1", variantId: "default" },
      { caseId: "story2", variantId: "default", threshold: 0.2 },
    ];

    it("should compare files with test case specific thresholds", async () => {
      mockReaddirSync
        .mockReturnValueOnce([
          "story1-default.png",
          "story2-default.png",
        ] as any)
        .mockReturnValueOnce([
          "story1-default.png",
          "story2-default.png",
        ] as any);

      mockOdiffCompare
        .mockResolvedValueOnce({ match: true })
        .mockResolvedValueOnce({
          match: false,
          reason: "pixel-diff",
          diffCount: 50,
          diffPercentage: 3.1,
        });

      const result = await compareBaseAndCurrentWithTestCases(
        mockConfig as any,
        mockTestCases as any
      );

      expect(result).toHaveLength(2);
      expect(mockOdiffCompare).toHaveBeenNthCalledWith(
        1,
        join(process.cwd(), "test-dir", "current", "story1-default.png"),
        join(process.cwd(), "test-dir", "base", "story1-default.png"),
        join(process.cwd(), "test-dir", "diff", "story1-default.png"),
        {
          threshold: 0.1, // default threshold
          diffColor: "#00ff00",
        }
      );
      expect(mockOdiffCompare).toHaveBeenNthCalledWith(
        2,
        join(process.cwd(), "test-dir", "current", "story2-default.png"),
        join(process.cwd(), "test-dir", "base", "story2-default.png"),
        join(process.cwd(), "test-dir", "diff", "story2-default.png"),
        {
          threshold: 0.2, // test case specific threshold
          diffColor: "#00ff00",
        }
      );
    });

    it("should handle missing config threshold", async () => {
      const configWithoutThreshold = { ...mockConfig };
      if ("threshold" in configWithoutThreshold) {
        delete (configWithoutThreshold as any).threshold;
      }

      mockReaddirSync
        .mockReturnValueOnce(["story1-default.png"] as any)
        .mockReturnValueOnce(["story1-default.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      await compareBaseAndCurrentWithTestCases(
        configWithoutThreshold as any,
        [mockTestCases[0]] as any
      );

      expect(mockOdiffCompare).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        {
          threshold: 0.1, // DEFAULT_THRESHOLD
          diffColor: "#00ff00",
        }
      );
    });
  });
});
