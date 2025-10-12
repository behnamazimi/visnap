import { join } from "path";

import odiff from "odiff-bin";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

import { compareDirectories, compareTestCases } from "./compare";

import { getErrorMessage } from "@/utils/error-handler";

// Mock dependencies
vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("odiff-bin", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("pixelmatch", () => ({
  default: vi.fn(),
}));

vi.mock("pngjs", () => ({
  PNG: Object.assign(
    vi.fn().mockImplementation(() => ({
      data: new Uint8Array(40000),
      width: 100,
      height: 100,
    })),
    {
      sync: {
        read: vi.fn().mockReturnValue({
          data: new Uint8Array(40000),
          width: 100,
          height: 100,
        }),
        write: vi.fn().mockReturnValue(Buffer.from("mock-png-data")),
      },
    }
  ),
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
  let mockReaddir: any;
  const mockOdiffCompare = vi.mocked(odiff.compare);
  const mockPixelmatch = vi.mocked(pixelmatch);
  const mockPNG = vi.mocked(PNG);
  const mockGetErrorMessage = vi.mocked(getErrorMessage);

  beforeAll(async () => {
    const fsPromises = await import("fs/promises");
    mockReaddir = vi.mocked(fsPromises.readdir);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("compareDirectories with odiff", () => {
    it("should compare files and return match results", async () => {
      mockReaddir
        .mockResolvedValueOnce(["file1.png", "file2.png"] as any)
        .mockResolvedValueOnce(["file1.png", "file2.png"] as any);

      mockOdiffCompare
        .mockResolvedValueOnce({ match: true })
        .mockResolvedValueOnce({
          match: false,
          reason: "pixel-diff",
          diffCount: 100,
          diffPercentage: 5.2,
        });

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "odiff",
      });

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
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png", "file2.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "odiff",
      });

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
      mockReaddir
        .mockResolvedValueOnce(["file1.png", "file2.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "odiff",
      });

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
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "odiff",
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
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      const error = new Error(
        "Could not load comparison image: /base/file1.png"
      );
      mockOdiffCompare.mockRejectedValueOnce(error);
      mockGetErrorMessage.mockReturnValue(
        "Could not load comparison image: /base/file1.png"
      );

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "odiff",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "missing-base",
        diffPercentage: 0,
      });
    });

    it("should handle generic odiff errors", async () => {
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      const error = new Error("Generic error");
      mockOdiffCompare.mockRejectedValueOnce(error);
      mockGetErrorMessage.mockReturnValue("Generic error");

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "odiff",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "error",
        diffPercentage: 0,
      });
    });
  });

  describe("compareDirectories with pixelmatch", () => {
    it("should compare files using pixelmatch", async () => {
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      // Mock PNG data is handled by global mock
      mockPixelmatch.mockReturnValue(50); // 50 mismatched pixels

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "pixelmatch",
        threshold: 0.1,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "pixel-diff",
        diffPercentage: 0.5, // 50/10000 * 100
      });
    });

    it("should handle pixelmatch with matching images", async () => {
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      // Mock PNG data is handled by global mock
      mockPixelmatch.mockReturnValue(0); // No mismatched pixels

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "pixelmatch",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: true,
        reason: "",
        diffPercentage: 0,
      });
    });

    it("should handle pixelmatch errors", async () => {
      mockReaddir
        .mockResolvedValueOnce(["file1.png"] as any)
        .mockResolvedValueOnce(["file1.png"] as any);

      const error = new Error("ENOENT: no such file or directory");
      (mockPNG.sync.read as any).mockImplementation(() => {
        throw error;
      });
      mockGetErrorMessage.mockReturnValue("ENOENT: no such file or directory");

      const result = await compareDirectories("/current", "/base", "/diff", {
        comparisonCore: "pixelmatch",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "error",
        diffPercentage: 0,
      });
    });
  });

  describe("compareTestCases", () => {
    const mockConfig = {
      screenshotDir: "test-dir",
      comparison: {
        core: "odiff" as const,
        threshold: 0.1,
        diffColor: "#00ff00",
      },
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
      mockReaddir
        .mockResolvedValueOnce([
          "story1-default.png",
          "story2-default.png",
        ] as any)
        .mockResolvedValueOnce([
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

      const result = await compareTestCases(
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

    it("should handle missing comparison config with defaults", async () => {
      const configWithoutComparison = { ...mockConfig };
      delete (configWithoutComparison as any).comparison;

      mockReaddir
        .mockResolvedValueOnce(["story1-default.png"] as any)
        .mockResolvedValueOnce(["story1-default.png"] as any);

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      await compareTestCases(
        configWithoutComparison as any,
        [mockTestCases[0]] as any
      );

      expect(mockOdiffCompare).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        {
          threshold: 0.1, // DEFAULT_THRESHOLD
          diffColor: "#00ff00", // DEFAULT_DIFF_COLOR
        }
      );
    });
  });
});
