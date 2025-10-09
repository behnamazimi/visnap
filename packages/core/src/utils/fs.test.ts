import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  ensureVttDirectories,
  getCurrentDir,
  getBaseDir,
  getDiffDir,
} from "./fs";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Mock the resolveScreenshotDir function
vi.mock("../../lib", () => ({
  resolveScreenshotDir: vi.fn(dir => dir || "vividiff"),
}));

describe("fs utilities", () => {
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ensureVttDirectories", () => {
    it("should create all directories when none exist", () => {
      mockExistsSync.mockReturnValue(false);

      ensureVttDirectories();

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "vividiff")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "vividiff", "base")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "vividiff", "current")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "vividiff", "diff")
      );
    });

    it("should create only missing directories", () => {
      mockExistsSync
        .mockReturnValueOnce(true) // vtt dir exists
        .mockReturnValueOnce(false) // base dir doesn't exist
        .mockReturnValueOnce(true) // current dir exists
        .mockReturnValueOnce(false); // diff dir doesn't exist

      ensureVttDirectories();

      expect(mockMkdirSync).toHaveBeenCalledTimes(2);
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "vividiff", "base")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "vividiff", "diff")
      );
    });

    it("should use custom screenshot directory", () => {
      mockExistsSync.mockReturnValue(false);

      ensureVttDirectories("custom-dir");

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "custom-dir")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "custom-dir", "base")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "custom-dir", "current")
      );
      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "custom-dir", "diff")
      );
    });
  });

  describe("getCurrentDir", () => {
    it("should return current directory path with default screenshot dir", () => {
      const result = getCurrentDir();
      expect(result).toBe(join(process.cwd(), "vividiff", "current"));
    });

    it("should return current directory path with custom screenshot dir", () => {
      const result = getCurrentDir("custom-dir");
      expect(result).toBe(join(process.cwd(), "custom-dir", "current"));
    });
  });

  describe("getBaseDir", () => {
    it("should return base directory path with default screenshot dir", () => {
      const result = getBaseDir();
      expect(result).toBe(join(process.cwd(), "vividiff", "base"));
    });

    it("should return base directory path with custom screenshot dir", () => {
      const result = getBaseDir("custom-dir");
      expect(result).toBe(join(process.cwd(), "custom-dir", "base"));
    });
  });

  describe("getDiffDir", () => {
    it("should return diff directory path with default screenshot dir", () => {
      const result = getDiffDir();
      expect(result).toBe(join(process.cwd(), "vividiff", "diff"));
    });

    it("should return diff directory path with custom screenshot dir", () => {
      const result = getDiffDir("custom-dir");
      expect(result).toBe(join(process.cwd(), "custom-dir", "diff"));
    });
  });
});
