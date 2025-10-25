/**
 * @fileoverview Tests for package script manager utilities
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  VISUAL_TEST_SCRIPTS,
  addVisualTestScripts,
  addVisualTestScriptsToProject,
  findTargetPackageJson,
  readPackageJson,
  writePackageJson,
} from "./package-script-manager";

describe("package-script-manager", () => {
  let tempDir: string;
  let packageJsonPath: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = join(tmpdir(), `visnap-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    packageJsonPath = join(tempDir, "package.json");
  });

  afterEach(() => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("VISUAL_TEST_SCRIPTS", () => {
    it("should contain the expected scripts", () => {
      expect(VISUAL_TEST_SCRIPTS).toEqual({
        "visnap:test": "visnap test",
        "visnap:update": "visnap update",
        "visnap:open": "visnap open",
      });
    });
  });

  describe("findTargetPackageJson", () => {
    it("should return null when no package.json exists", () => {
      // Mock process.cwd to return temp directory (no package.json)
      vi.spyOn(process, "cwd").mockReturnValue(tempDir);

      const result = findTargetPackageJson();
      expect(result).toBeNull();

      vi.restoreAllMocks();
    });

    it("should find package.json in current directory", () => {
      // Create a package.json in temp directory
      writeFileSync(packageJsonPath, JSON.stringify({ name: "test-project" }));

      // Mock process.cwd to return temp directory
      vi.spyOn(process, "cwd").mockReturnValue(tempDir);

      const result = findTargetPackageJson();
      expect(result).toBe(packageJsonPath);

      vi.restoreAllMocks();
    });
  });

  describe("readPackageJson", () => {
    it("should read and parse valid package.json", () => {
      const packageJson = { name: "test-project", version: "1.0.0" };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson));

      const result = readPackageJson(packageJsonPath);
      expect(result).toEqual(packageJson);
    });

    it("should return null for invalid JSON", () => {
      writeFileSync(packageJsonPath, "invalid json");

      const result = readPackageJson(packageJsonPath);
      expect(result).toBeNull();
    });

    it("should return null for non-existent file", () => {
      const result = readPackageJson(join(tempDir, "nonexistent.json"));
      expect(result).toBeNull();
    });
  });

  describe("writePackageJson", () => {
    it("should write package.json with proper formatting", () => {
      const packageJson = { name: "test-project", version: "1.0.0" };

      writePackageJson(packageJsonPath, packageJson);

      expect(existsSync(packageJsonPath)).toBe(true);
      const content = readFileSync(packageJsonPath, "utf-8");
      expect(content).toBe(JSON.stringify(packageJson, null, 2) + "\n");
    });
  });

  describe("addVisualTestScripts", () => {
    it("should add all scripts to empty package.json", () => {
      const packageJson = { name: "test-project" };
      const result = addVisualTestScripts(packageJson);

      expect(result.added).toEqual(Object.keys(VISUAL_TEST_SCRIPTS));
      expect(result.skipped).toEqual([]);
      expect(packageJson.scripts).toEqual(VISUAL_TEST_SCRIPTS);
    });

    it("should add scripts to existing scripts object", () => {
      const packageJson = {
        name: "test-project",
        scripts: { build: "npm run build" },
      };
      const result = addVisualTestScripts(packageJson);

      expect(result.added).toEqual(Object.keys(VISUAL_TEST_SCRIPTS));
      expect(result.skipped).toEqual([]);
      expect(packageJson.scripts).toEqual({
        build: "npm run build",
        ...VISUAL_TEST_SCRIPTS,
      });
    });

    it("should skip existing scripts", () => {
      const packageJson = {
        name: "test-project",
        scripts: { "visnap:test": "custom test command" },
      };
      const result = addVisualTestScripts(packageJson);

      expect(result.added).toEqual(["visnap:update", "visnap:open"]);
      expect(result.skipped).toEqual(["visnap:test"]);
      expect(packageJson.scripts).toEqual({
        "visnap:test": "custom test command",
        "visnap:update": "visnap update",
        "visnap:open": "visnap open",
      });
    });
  });

  describe("addVisualTestScriptsToProject", () => {
    it("should return error when no package.json exists", () => {
      // Mock process.cwd to return temp directory (no package.json)
      vi.spyOn(process, "cwd").mockReturnValue(tempDir);

      const result = addVisualTestScriptsToProject();

      expect(result.success).toBe(false);
      expect(result.packageJsonPath).toBeNull();
      expect(result.error).toContain("No package.json found");

      vi.restoreAllMocks();
    });

    it("should successfully add scripts to existing package.json", () => {
      // Create a package.json
      const packageJson = { name: "test-project" };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson));

      // Mock process.cwd to return temp directory
      vi.spyOn(process, "cwd").mockReturnValue(tempDir);

      const result = addVisualTestScriptsToProject();

      expect(result.success).toBe(true);
      expect(result.packageJsonPath).toBe(packageJsonPath);
      expect(result.added).toEqual(Object.keys(VISUAL_TEST_SCRIPTS));
      expect(result.skipped).toEqual([]);

      // Verify the file was actually written
      const updatedPackageJson = JSON.parse(
        readFileSync(packageJsonPath, "utf-8")
      );
      expect(updatedPackageJson.scripts).toEqual(VISUAL_TEST_SCRIPTS);

      vi.restoreAllMocks();
    });

    it("should skip existing scripts", () => {
      // Create a package.json with one existing script
      const packageJson = {
        name: "test-project",
        scripts: { "visnap:test": "custom test command" },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson));

      // Mock process.cwd to return temp directory
      vi.spyOn(process, "cwd").mockReturnValue(tempDir);

      const result = addVisualTestScriptsToProject();

      expect(result.success).toBe(true);
      expect(result.added).toEqual(["visnap:update", "visnap:open"]);
      expect(result.skipped).toEqual(["visnap:test"]);

      vi.restoreAllMocks();
    });
  });
});
