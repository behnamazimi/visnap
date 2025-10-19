import { describe, it, expect } from "vitest";

import { validatePath, validateScreenshotDir } from "./path-validation";

describe("path-validation", () => {
  describe("validatePath", () => {
    it("should validate safe relative paths", () => {
      const baseDir = "/test/base";
      const safePath = "screenshots/test.png";

      const result = validatePath(safePath, baseDir);
      expect(result).toBe("/test/base/screenshots/test.png");
    });

    it("should reject paths with null bytes", () => {
      const baseDir = "/test/base";
      const unsafePath = "screenshots\0test.png";

      expect(() => validatePath(unsafePath, baseDir)).toThrow(
        "Path contains null bytes which are not allowed"
      );
    });

    it("should reject paths with suspicious double separators", () => {
      const baseDir = "/test/base";
      const unsafePath = "screenshots//test.png";

      expect(() => validatePath(unsafePath, baseDir)).toThrow(
        "Path contains suspicious double separators"
      );
    });

    it("should reject path traversal attempts with ..", () => {
      const baseDir = "/test/base";
      const unsafePath = "../../../etc/passwd";

      expect(() => validatePath(unsafePath, baseDir)).toThrow(
        "Path traversal detected: ../../../etc/passwd resolves outside base directory"
      );
    });

    it("should reject absolute paths", () => {
      const baseDir = "/test/base";
      const unsafePath = "/absolute/path";

      expect(() => validatePath(unsafePath, baseDir)).toThrow(
        "Path traversal detected: /absolute/path resolves outside base directory"
      );
    });

    it("should handle complex path traversal attempts", () => {
      const baseDir = "/test/base";
      const unsafePath = "screenshots/../../../etc/passwd";

      expect(() => validatePath(unsafePath, baseDir)).toThrow(
        "Path traversal detected: screenshots/../../../etc/passwd resolves outside base directory"
      );
    });

    it("should handle Windows-style path traversal", () => {
      const baseDir = "C:\\test\\base";
      const unsafePath = "..\\..\\windows\\system32";

      expect(() => validatePath(unsafePath, baseDir)).toThrow(
        "Path traversal detected: ..\\..\\windows\\system32 resolves outside base directory"
      );
    });

    it("should validate nested directory paths", () => {
      const baseDir = "/test/base";
      const safePath = "screenshots/2024/01/test.png";

      const result = validatePath(safePath, baseDir);
      expect(result).toBe("/test/base/screenshots/2024/01/test.png");
    });
  });

  describe("validateScreenshotDir", () => {
    it("should validate safe screenshot directory", () => {
      const safeDir = "visnap";
      const result = validateScreenshotDir(safeDir);
      expect(result).toBe(safeDir);
    });

    it("should validate nested screenshot directory", () => {
      const safeDir = "screenshots/visnap";
      const result = validateScreenshotDir(safeDir);
      expect(result).toBe(safeDir);
    });

    it("should reject empty string", () => {
      expect(() => validateScreenshotDir("")).toThrow(
        "Screenshot directory must be a non-empty string"
      );
    });

    it("should reject non-string input", () => {
      expect(() => validateScreenshotDir(null as any)).toThrow(
        "Screenshot directory must be a non-empty string"
      );
      expect(() => validateScreenshotDir(undefined as any)).toThrow(
        "Screenshot directory must be a non-empty string"
      );
    });

    it("should reject paths with null bytes", () => {
      const unsafeDir = "visnap\0";
      expect(() => validateScreenshotDir(unsafeDir)).toThrow(
        "Screenshot directory contains null bytes which are not allowed"
      );
    });

    it("should reject paths with path traversal sequences", () => {
      expect(() => validateScreenshotDir("visnap/..")).toThrow(
        "Invalid screenshot directory: visnap/... Directory cannot contain path traversal sequences."
      );

      expect(() => validateScreenshotDir("visnap~")).toThrow(
        "Invalid screenshot directory: visnap~. Directory cannot contain path traversal sequences."
      );
    });

    it("should reject paths with suspicious double separators", () => {
      expect(() => validateScreenshotDir("visnap//screenshots")).toThrow(
        "Screenshot directory contains suspicious double separators"
      );
    });

    it("should reject absolute paths", () => {
      expect(() => validateScreenshotDir("/absolute/path")).toThrow(
        "Screenshot directory should be relative to current working directory, not absolute: /absolute/path"
      );
    });

    it("should reject empty or separator-only paths", () => {
      expect(() => validateScreenshotDir("/")).toThrow(
        "Screenshot directory should be relative to current working directory, not absolute: /"
      );

      expect(() => validateScreenshotDir("\\")).toThrow(
        "Screenshot directory cannot be empty or just a separator"
      );

      expect(() => validateScreenshotDir("   ")).toThrow(
        "Screenshot directory cannot be empty or just a separator"
      );
    });

    it("should handle whitespace trimming", () => {
      const dirWithWhitespace = "  visnap  ";
      const result = validateScreenshotDir(dirWithWhitespace);
      expect(result).toBe(dirWithWhitespace);
    });
  });
});
