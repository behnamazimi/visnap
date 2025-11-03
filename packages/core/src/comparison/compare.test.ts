import { join } from "path";

import type { StorageAdapter } from "@visnap/protocol";
import odiff from "odiff-bin";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { compareDirectories, compareTestCases } from "./compare";

import { getErrorMessage } from "@/utils/error-handler";

// No fs/promises mocking needed since we use StorageAdapter now

// Mock storage adapter helper
const createMockStorage = (): StorageAdapter => ({
  list: vi.fn().mockResolvedValue(["file1.png", "file2.png"]),
  getReadablePath: vi.fn().mockImplementation((kind, filename) => {
    if (kind === "current") return `/current/${filename}`;
    if (kind === "base") return `/base/${filename}`;
    if (kind === "diff") return `/diff/${filename}`;
    return `/${kind}/${filename}`;
  }),
  write: vi.fn().mockResolvedValue(""),
  exists: vi.fn().mockResolvedValue(true),
  read: vi.fn().mockResolvedValue(Buffer.from("mock-png-data")),
  cleanup: vi.fn().mockResolvedValue(undefined),
});

vi.mock("odiff-bin", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("pixelmatch", () => ({
  default: vi.fn(),
}));

vi.mock("pngjs", () => {
  const mockBitblt = vi.fn();
  const mockSyncRead = vi.fn().mockImplementation(() => ({
    data: new Uint8Array(40000),
    width: 100,
    height: 100,
  }));
  return {
    PNG: Object.assign(
      vi
        .fn()
        .mockImplementation(
          (options?: { width?: number; height?: number }) => ({
            data: new Uint8Array(
              (options?.width || 100) * (options?.height || 100) * 4
            ),
            width: options?.width || 100,
            height: options?.height || 100,
          })
        ),
      {
        bitblt: mockBitblt,
        sync: {
          read: mockSyncRead,
          write: vi.fn().mockReturnValue(Buffer.from("mock-png-data")),
        },
      }
    ),
  };
});

vi.mock("@/utils/error-handler", () => ({
  getErrorMessage: vi.fn(),
}));

vi.mock("../../utils/fs", () => ({
  getCurrentDir: vi.fn(() => "/test/current"),
  getBaseDir: vi.fn(() => "/test/base"),
  getDiffDir: vi.fn(() => "/test/diff"),
}));

describe("compare", () => {
  const mockOdiffCompare = vi.mocked(odiff.compare);
  const mockPixelmatch = vi.mocked(pixelmatch);
  const mockPNG = vi.mocked(PNG);
  const mockGetErrorMessage = vi.mocked(getErrorMessage);

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup getErrorMessage to return the error message
    mockGetErrorMessage.mockImplementation((error: unknown) => {
      if (error instanceof Error) return error.message;
      return String(error);
    });
    // Ensure PNG mocks are properly set up
    const mockPNGSyncRead = (PNG as any).sync.read;
    const mockPNGBitblt = (PNG as any).bitblt;
    if (mockPNGSyncRead) {
      mockPNGSyncRead.mockImplementation(() => ({
        data: new Uint8Array(40000),
        width: 100,
        height: 100,
      }));
    }
    if (mockPNGBitblt) {
      mockPNGBitblt.mockImplementation(() => {});
    }
  });

  describe("compareDirectories with odiff", () => {
    it("should compare files and return match results", async () => {
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png", "file2.png"])
      );

      mockOdiffCompare
        .mockResolvedValueOnce({ match: true })
        .mockResolvedValueOnce({
          match: false,
          reason: "pixel-diff",
          diffCount: 100,
          diffPercentage: 5.2,
        });

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation((kind: string) =>
        Promise.resolve(
          kind === "current" ? ["file1.png"] : ["file1.png", "file2.png"]
        )
      );

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation((kind: string) =>
        Promise.resolve(
          kind === "current" ? ["file1.png", "file2.png"] : ["file1.png"]
        )
      );

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png"])
      );

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png"])
      );

      const error = new Error(
        "Could not load comparison image: /base/file1.png"
      );
      mockOdiffCompare.mockRejectedValueOnce(error);
      mockGetErrorMessage.mockReturnValue(
        "Could not load comparison image: /base/file1.png"
      );

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png"])
      );

      const error = new Error("Generic error");
      mockOdiffCompare.mockRejectedValueOnce(error);
      mockGetErrorMessage.mockReturnValue("Generic error");

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png"])
      );

      // Mock PNG data is handled by global mock
      // Ensure pixelmatch returns 50 mismatched pixels
      mockPixelmatch.mockImplementation(() => 50);

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png"])
      );

      // Mock PNG data is handled by global mock
      // Ensure pixelmatch returns 0 mismatched pixels
      mockPixelmatch.mockImplementation(() => 0);

      const result = await compareDirectories(mockStorage, {
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["file1.png"])
      );

      const error = new Error("ENOENT: no such file or directory");
      (mockPNG.sync.read as any).mockImplementation(() => {
        throw error;
      });
      mockGetErrorMessage.mockReturnValue("ENOENT: no such file or directory");

      const result = await compareDirectories(mockStorage, {
        comparisonCore: "pixelmatch",
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "file1.png",
        match: false,
        reason: "missing-base",
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
      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["story1-default.png", "story2-default.png"])
      );

      mockOdiffCompare
        .mockResolvedValueOnce({ match: true })
        .mockResolvedValueOnce({
          match: false,
          reason: "pixel-diff",
          diffCount: 50,
          diffPercentage: 3.1,
        });

      const result = await compareTestCases(
        mockStorage,
        mockConfig as any,
        mockTestCases as any
      );

      expect(result).toHaveLength(2);
      expect(mockOdiffCompare).toHaveBeenNthCalledWith(
        1,
        join("/current", "story1-default.png"),
        join("/base", "story1-default.png"),
        join("/diff", "story1-default.png"),
        {
          threshold: 0.1, // default threshold
          diffColor: "#00ff00",
        }
      );
      expect(mockOdiffCompare).toHaveBeenNthCalledWith(
        2,
        join("/current", "story2-default.png"),
        join("/base", "story2-default.png"),
        join("/diff", "story2-default.png"),
        {
          threshold: 0.2, // test case specific threshold
          diffColor: "#00ff00",
        }
      );
    });

    it("should handle missing comparison config with defaults", async () => {
      const configWithoutComparison = { ...mockConfig };
      delete (configWithoutComparison as any).comparison;

      const mockStorage = createMockStorage();
      (mockStorage.list as any).mockImplementation(() =>
        Promise.resolve(["story1-default.png"])
      );

      mockOdiffCompare.mockResolvedValueOnce({
        match: true,
      });

      await compareTestCases(
        mockStorage,
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
