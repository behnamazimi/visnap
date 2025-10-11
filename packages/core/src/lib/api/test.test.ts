import { describe, it, expect, vi, beforeEach } from "vitest";

import { runTestCasesOnBrowser } from "../../utils/testcase-runner";
import { resolveEffectiveConfig } from "../config";

import { runVisualTests, runVisualTestsCli } from "./test";

// Mock dependencies
vi.mock("../config", async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual && typeof actual === "object" ? actual : {}),
    resolveEffectiveConfig: vi.fn(),
  };
});

vi.mock("../../utils/testcase-runner", () => ({
  runTestCasesOnBrowser: vi.fn().mockImplementation(async () => ({
    outcome: { passed: 5, total: 5, captureFailures: 0 },
    failures: [],
    captureFailures: [],
  })),
}));

describe("test API", () => {
  const mockResolveEffectiveConfig = vi.mocked(resolveEffectiveConfig);
  const mockRunTestCasesOnBrowser = vi.mocked(runTestCasesOnBrowser);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runVisualTests", () => {
    it("should run visual tests successfully", async () => {
      const mockConfig = {
        screenshotDir: "test-dir",
        threshold: 0.1,
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
      };

      const mockOutcome = {
        passed: 5,
        total: 5,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig as any);
      mockRunTestCasesOnBrowser.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      const result = await runVisualTests();

      expect(result.success).toBe(true);
      expect(result.outcome).toEqual(mockOutcome);
      expect(result.exitCode).toBe(0);
      expect(result.failures).toEqual([]);
      expect(result.captureFailures).toEqual([]);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, undefined);
      expect(mockRunTestCasesOnBrowser).toHaveBeenCalledWith(
        mockConfig,
        "test"
      );
    });

    it("should handle test failures", async () => {
      const mockConfig = {
        screenshotDir: "test-dir",
        threshold: 0.1,
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
      };

      const mockOutcome = {
        passed: 3,
        total: 5,
        captureFailures: 1,
        failedDiffs: 1,
        failedMissingCurrent: 1,
        failedMissingBase: 1,
        failedErrors: 0,
      };

      const mockFailures = [
        { id: "story1", reason: "pixel-diff", diffPercentage: 5.2 },
        { id: "story2", reason: "missing-base" },
      ];

      const mockCaptureFailures = [
        { id: "story3", error: "Screenshot failed" },
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig as any);
      mockRunTestCasesOnBrowser.mockResolvedValue({
        outcome: mockOutcome,
        failures: mockFailures,
        captureFailures: mockCaptureFailures,
      });

      const result = await runVisualTests();

      expect(result.success).toBe(false);
      expect(result.outcome).toEqual(mockOutcome);
      expect(result.exitCode).toBe(1);
      expect(result.failures).toEqual(mockFailures);
      expect(result.captureFailures).toEqual(mockCaptureFailures);
    });

    it("should throw error when no outcome is returned", async () => {
      const mockConfig = {
        screenshotDir: "test-dir",
        threshold: 0.1,
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig as any);
      mockRunTestCasesOnBrowser.mockResolvedValue({
        outcome: undefined,
        failures: [],
        captureFailures: [],
      });

      await expect(runVisualTests()).rejects.toThrow(
        "Test run did not return outcome data"
      );
    });

    it("should pass custom options to resolveEffectiveConfig", async () => {
      const mockConfig = {
        screenshotDir: "test-dir",
        threshold: 0.1,
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
      };

      const mockOutcome = {
        passed: 5,
        total: 5,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      const customOptions = {
        comparison: {
          core: "odiff" as const,
          threshold: 0.2,
        },
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig as any);
      mockRunTestCasesOnBrowser.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await runVisualTests(customOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        undefined
      );
    });
  });

  describe("runVisualTestsCli", () => {
    it("should pass CLI options to resolveEffectiveConfig", async () => {
      const mockConfig = {
        screenshotDir: "test-dir",
        threshold: 0.1,
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
      };

      const mockOutcome = {
        passed: 5,
        total: 5,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      const cliOptions = {
        include: ["button*"],
        exclude: ["*page*"],
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig as any);
      mockRunTestCasesOnBrowser.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await runVisualTestsCli({}, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, cliOptions);
    });
  });
});
