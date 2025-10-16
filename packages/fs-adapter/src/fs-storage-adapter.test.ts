import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { FsStorageAdapter } from "./fs-storage-adapter";

describe("FsStorageAdapter", () => {
  let tempDir: string;
  let adapter: FsStorageAdapter;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "visnap-fs-adapter-test-"));
    adapter = new FsStorageAdapter({ screenshotDir: tempDir });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe("write", () => {
    it("should write file to correct directory based on kind", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      const path = await adapter.write("base", "test.png", buffer);

      expect(path).toContain("base");
      expect(path).toContain("test.png");
    });

    it("should sanitize filename", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      const path = await adapter.write("current", "test@#$%.png", buffer);

      expect(path).toContain("test____.png");
    });

    it("should throw error for invalid filename", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);

      await expect(
        adapter.write("base", "../../etc/passwd", buffer)
      ).rejects.toThrow("Invalid filename");
    });
  });

  describe("read", () => {
    it("should read file content", async () => {
      const originalBuffer = new Uint8Array([1, 2, 3, 4]);
      await adapter.write("base", "test.png", originalBuffer);

      const readBuffer = await adapter.read("base", "test.png");
      expect(readBuffer).toEqual(originalBuffer);
    });

    it("should throw error for non-existent file", async () => {
      await expect(adapter.read("base", "nonexistent.png")).rejects.toThrow();
    });
  });

  describe("getReadablePath", () => {
    it("should return correct path for each kind", async () => {
      const basePath = await adapter.getReadablePath("base", "test.png");
      const currentPath = await adapter.getReadablePath("current", "test.png");
      const diffPath = await adapter.getReadablePath("diff", "test.png");

      expect(basePath).toContain("base");
      expect(currentPath).toContain("current");
      expect(diffPath).toContain("diff");
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      await adapter.write("base", "test.png", buffer);

      const exists = await adapter.exists("base", "test.png");
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const exists = await adapter.exists("base", "nonexistent.png");
      expect(exists).toBe(false);
    });
  });

  describe("list", () => {
    it("should return list of PNG files", async () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      await adapter.write("base", "test1.png", buffer);
      await adapter.write("base", "test2.png", buffer);
      await adapter.write("base", "test.txt", buffer); // Should be filtered out

      const files = await adapter.list("base");
      expect(files).toContain("test1.png");
      expect(files).toContain("test2.png");
      expect(files).not.toContain("test.txt");
    });

    it("should return empty array for non-existent directory", async () => {
      const files = await adapter.list("base");
      expect(files).toEqual([]);
    });
  });

  describe("cleanup", () => {
    it("should complete without error", async () => {
      await expect(adapter.cleanup()).resolves.toBeUndefined();
    });
  });

  describe("custom directory names", () => {
    it("should use custom directory names", async () => {
      const customAdapter = new FsStorageAdapter({
        screenshotDir: tempDir,
        baseDirName: "baselines",
        currentDirName: "screenshots",
        diffDirName: "differences",
      });

      const buffer = new Uint8Array([1, 2, 3, 4]);
      const path = await customAdapter.write("base", "test.png", buffer);

      expect(path).toContain("baselines");
    });
  });
});
