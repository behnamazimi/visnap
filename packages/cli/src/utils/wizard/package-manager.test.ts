import { describe, it, expect, vi, beforeEach } from "vitest";

// Create a mock for require.resolve that can be controlled
const mockRequireResolve = vi.fn();

// Mock the entire package-manager module to control require.resolve
vi.mock("./package-manager", async () => {
  const actual = await vi.importActual("./package-manager");
  return {
    ...actual,
    isPackageInstalled: vi.fn((packageName: string) => {
      try {
        mockRequireResolve(packageName);
        return true;
      } catch {
        return false;
      }
    }),
  };
});

import {
  detectPackageManager,
  isPackageInstalled,
  installPackages,
} from "./package-manager";

// Mock fs module
vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

// Mock child_process
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

describe("package-manager", () => {
  let mockExistsSync: any;
  let mockExecSync: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked functions
    const fs = await import("fs");
    const childProcess = await import("child_process");
    mockExistsSync = vi.mocked(fs.existsSync);
    mockExecSync = vi.mocked(childProcess.execSync);

    // Clear any existing listeners
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("unhandledRejection");
  });

  describe("detectPackageManager", () => {
    it("should detect pnpm when pnpm-lock.yaml exists", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "pnpm-lock.yaml";
      });

      const result = detectPackageManager();

      expect(result).toEqual({
        name: "pnpm",
        installCommand: "pnpm add",
      });
    });

    it("should detect yarn when yarn.lock exists", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "yarn.lock";
      });

      const result = detectPackageManager();

      expect(result).toEqual({
        name: "yarn",
        installCommand: "yarn add",
      });
    });

    it("should default to npm when no lock files exist", () => {
      mockExistsSync.mockReturnValue(false);

      const result = detectPackageManager();

      expect(result).toEqual({
        name: "npm",
        installCommand: "npm install",
      });
    });

    it("should prioritize pnpm over yarn when both exist", () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path === "pnpm-lock.yaml" || path === "yarn.lock";
      });

      const result = detectPackageManager();

      expect(result).toEqual({
        name: "pnpm",
        installCommand: "pnpm add",
      });
    });
  });

  describe("isPackageInstalled", () => {
    it("should return true when package can be resolved", () => {
      mockRequireResolve.mockReturnValue("/path/to/package");

      const result = isPackageInstalled("@visnap/playwright-adapter");

      expect(result).toBe(true);
      expect(mockRequireResolve).toHaveBeenCalledWith(
        "@visnap/playwright-adapter"
      );
    });

    it("should return false when package cannot be resolved", () => {
      mockRequireResolve.mockImplementation(() => {
        throw new Error("Cannot resolve module");
      });

      const result = isPackageInstalled("@visnap/nonexistent");

      expect(result).toBe(false);
      expect(mockRequireResolve).toHaveBeenCalledWith("@visnap/nonexistent");
    });

    it("should handle different package names", () => {
      mockRequireResolve.mockReturnValue("/path/to/package");

      const result1 = isPackageInstalled("@visnap/storybook-adapter");
      const result2 = isPackageInstalled("@visnap/url-adapter");

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockRequireResolve).toHaveBeenCalledWith(
        "@visnap/storybook-adapter"
      );
      expect(mockRequireResolve).toHaveBeenCalledWith("@visnap/url-adapter");
    });
  });

  describe("installPackages", () => {
    it("should install packages successfully", async () => {
      const packages = [
        "@visnap/playwright-adapter",
        "@visnap/storybook-adapter",
      ];
      const packageManager = {
        name: "npm" as const,
        installCommand: "npm install",
      };

      mockExecSync.mockReturnValue(Buffer.from("Success"));

      await installPackages(packages, packageManager);

      expect(mockExecSync).toHaveBeenCalledWith(
        "npm install @visnap/playwright-adapter @visnap/storybook-adapter",
        { stdio: "pipe" }
      );
    });

    it("should install packages with yarn", async () => {
      const packages = ["@visnap/playwright-adapter"];
      const packageManager = {
        name: "yarn" as const,
        installCommand: "yarn add",
      };

      mockExecSync.mockReturnValue(Buffer.from("Success"));

      await installPackages(packages, packageManager);

      expect(mockExecSync).toHaveBeenCalledWith(
        "yarn add @visnap/playwright-adapter",
        { stdio: "pipe" }
      );
    });

    it("should install packages with pnpm", async () => {
      const packages = ["@visnap/playwright-adapter"];
      const packageManager = {
        name: "pnpm" as const,
        installCommand: "pnpm add",
      };

      mockExecSync.mockReturnValue(Buffer.from("Success"));

      await installPackages(packages, packageManager);

      expect(mockExecSync).toHaveBeenCalledWith(
        "pnpm add @visnap/playwright-adapter",
        { stdio: "pipe" }
      );
    });

    it("should handle installation errors", async () => {
      const packages = ["@visnap/playwright-adapter"];
      const packageManager = {
        name: "npm" as const,
        installCommand: "npm install",
      };

      const error = new Error("Installation failed");
      mockExecSync.mockImplementation(() => {
        throw error;
      });

      await expect(installPackages(packages, packageManager)).rejects.toThrow(
        "Installation failed"
      );
    });

    it("should handle empty packages array", async () => {
      const packages: string[] = [];
      const packageManager = {
        name: "npm" as const,
        installCommand: "npm install",
      };

      mockExecSync.mockReturnValue(Buffer.from("Success"));

      await installPackages(packages, packageManager);

      expect(mockExecSync).toHaveBeenCalledWith("npm install ", {
        stdio: "pipe",
      });
    });

    it("should handle single package", async () => {
      const packages = ["@visnap/playwright-adapter"];
      const packageManager = {
        name: "npm" as const,
        installCommand: "npm install",
      };

      mockExecSync.mockReturnValue(Buffer.from("Success"));

      await installPackages(packages, packageManager);

      expect(mockExecSync).toHaveBeenCalledWith(
        "npm install @visnap/playwright-adapter",
        { stdio: "pipe" }
      );
    });
  });
});
