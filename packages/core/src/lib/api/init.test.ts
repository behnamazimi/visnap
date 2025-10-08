import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  generateConfigContent,
  generateGitignoreContent,
} from "../../utils/config-generator";
import { resolveScreenshotDir } from "../config";

import { initializeProject } from "./init";

// Mock dependencies
vi.mock("fs", () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("../config", async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual || {}),
    resolveScreenshotDir: vi.fn(() => "visual-testing"),
  };
});

vi.mock("../../utils/config-generator", () => ({
  generateConfigContent: vi.fn().mockReturnValue("// Generated config content"),
  generateGitignoreContent: vi
    .fn()
    .mockReturnValue(
      "# Visual Testing Tool - Ignore generated screenshots\n# Keep baseline screenshots in version control, ignore current and diff\ncurrent/\ndiff/\n"
    ),
}));

describe("init API", () => {
  const mockWriteFileSync = vi.mocked(writeFileSync);
  const mockExistsSync = vi.mocked(existsSync);
  const mockMkdirSync = vi.mocked(mkdirSync);
  const mockResolveScreenshotDir = vi.mocked(resolveScreenshotDir);
  const mockGenerateConfigContent = vi.mocked(generateConfigContent);
  const mockGenerateGitignoreContent = vi.mocked(generateGitignoreContent);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateConfigContent.mockReturnValue("// Generated config content");
    mockGenerateGitignoreContent.mockReturnValue(
      "# Visual Testing Tool - Ignore generated screenshots\n# Keep baseline screenshots in version control, ignore current and diff\ncurrent/\ndiff/\n"
    );
  });

  describe("initializeProject", () => {
    it("should initialize project with default options", async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await initializeProject();

      expect(result.success).toBe(true);
      expect(result.configPath).toBe(join(process.cwd(), "vtt.config.ts"));
      expect(result.options).toEqual({
        configType: "ts",
        threshold: 0.1,
      });

      expect(mockGenerateConfigContent).toHaveBeenCalledWith({
        configType: "ts",
        threshold: 0.1,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), "vtt.config.ts"),
        "// Generated config content"
      );
    });

    it("should initialize project with custom options", async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await initializeProject({
        configType: "js",
        threshold: 0.2,
      });

      expect(result.success).toBe(true);
      expect(result.configPath).toBe(join(process.cwd(), "vtt.config.js"));
      expect(result.options).toEqual({
        configType: "js",
        threshold: 0.2,
      });

      expect(mockGenerateConfigContent).toHaveBeenCalledWith({
        configType: "js",
        threshold: 0.2,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), "vtt.config.js"),
        "// Generated config content"
      );
    });

    it("should throw error when config file already exists", async () => {
      mockExistsSync.mockReturnValue(true);

      await expect(initializeProject()).rejects.toThrow(
        "vtt.config.ts already exists in the current directory."
      );

      expect(mockWriteFileSync).not.toHaveBeenCalled();
    });

    it("should create screenshot directory and gitignore when directory doesn't exist", async () => {
      mockExistsSync
        .mockReturnValueOnce(false) // config file doesn't exist
        .mockReturnValueOnce(false); // screenshot directory doesn't exist

      await initializeProject();

      expect(mockMkdirSync).toHaveBeenCalledWith(
        join(process.cwd(), "visual-testing"),
        { recursive: true }
      );
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), "visual-testing", ".gitignore"),
        "# Visual Testing Tool - Ignore generated screenshots\n# Keep baseline screenshots in version control, ignore current and diff\ncurrent/\ndiff/\n"
      );
    });

    it("should create gitignore when screenshot directory already exists", async () => {
      mockExistsSync
        .mockReturnValueOnce(false) // config file doesn't exist
        .mockReturnValueOnce(true); // screenshot directory exists

      await initializeProject();

      expect(mockMkdirSync).not.toHaveBeenCalled();
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), "visual-testing", ".gitignore"),
        "# Visual Testing Tool - Ignore generated screenshots\n# Keep baseline screenshots in version control, ignore current and diff\ncurrent/\ndiff/\n"
      );
    });

    it("should use custom screenshot directory", async () => {
      mockExistsSync.mockReturnValue(false);
      mockResolveScreenshotDir.mockReturnValue("custom-screenshots");

      await initializeProject();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        join(process.cwd(), "custom-screenshots", ".gitignore"),
        "# Visual Testing Tool - Ignore generated screenshots\n# Keep baseline screenshots in version control, ignore current and diff\ncurrent/\ndiff/\n"
      );
    });
  });
});
