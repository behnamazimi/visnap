import { describe, it, expect, vi, beforeEach } from "vitest";

import { executeTestRun } from "../../utils/testcase-runner";
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
  executeTestRun: vi.fn().mockImplementation(async () => ({
    outcome: { passed: 5, total: 5, captureFailures: 0 },
    failures: [],
    captureFailures: [],
  })),
}));

describe("test API", () => {
  const mockResolveEffectiveConfig = vi.mocked(resolveEffectiveConfig);
  const mockExecuteTestRun = vi.mocked(executeTestRun);

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
      mockExecuteTestRun.mockResolvedValue({
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
      expect(result.config).toEqual({
        screenshotDir: "test-dir",
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
        comparison: undefined,
        runtime: undefined,
        viewport: undefined,
      });

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, undefined);
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "test");
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
      mockExecuteTestRun.mockResolvedValue({
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
      expect(result.config).toEqual({
        screenshotDir: "test-dir",
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
        comparison: undefined,
        runtime: undefined,
        viewport: undefined,
      });
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
      mockExecuteTestRun.mockResolvedValue({
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
      mockExecuteTestRun.mockResolvedValue({
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
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await runVisualTestsCli({}, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, cliOptions);
    });

    it("should include test case details and durations in outcome", async () => {
      const mockConfig = {
        screenshotDir: "test-dir",
        threshold: 0.1,
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
      };

      const mockTestCases = [
        {
          id: "button-default",
          captureFilename: "button-default.png",
          captureDurationMs: 1250.5,
          comparisonDurationMs: 45.2,
          totalDurationMs: 1295.7,
          status: "passed" as const,
          reason: undefined,
          diffPercentage: undefined,
          title: "Default",
          kind: "Components/Button",
          browser: "chromium",
          viewport: "1280x720",
        },
        {
          id: "button-hover",
          captureFilename: "button-hover.png",
          captureDurationMs: 1180.3,
          comparisonDurationMs: 42.1,
          totalDurationMs: 1222.4,
          status: "failed" as const,
          reason: "pixel-diff",
          diffPercentage: 2.5,
          title: "Hover",
          kind: "Components/Button",
          browser: "chromium",
          viewport: "1280x720",
        },
      ];

      const mockDurations = {
        totalCaptureDurationMs: 2430.8,
        totalComparisonDurationMs: 87.3,
        totalDurationMs: 2518.1,
      };

      const mockOutcome = {
        passed: 1,
        total: 2,
        captureFailures: 0,
        failedDiffs: 1,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
        testCases: mockTestCases,
        durations: mockDurations,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig as any);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [
          { id: "button-hover", reason: "pixel-diff", diffPercentage: 2.5 },
        ],
        captureFailures: [],
      });

      const result = await runVisualTests();

      expect(result.success).toBe(false);
      expect(result.outcome).toEqual(mockOutcome);
      expect(result.outcome.testCases).toEqual(mockTestCases);
      expect(result.outcome.durations).toEqual(mockDurations);
      expect(result.outcome.testCases?.[0].captureDurationMs).toBe(1250.5);
      expect(result.outcome.testCases?.[0].comparisonDurationMs).toBe(45.2);
      expect(result.outcome.testCases?.[0].totalDurationMs).toBe(1295.7);
      expect(result.outcome.testCases?.[0].captureFilename).toBe(
        "button-default.png"
      );
      expect(result.outcome.testCases?.[0].status).toBe("passed");
      expect(result.config).toEqual({
        screenshotDir: "test-dir",
        adapters: {
          browser: { name: "playwright" },
          testCase: [{ name: "storybook" }],
        },
        comparison: undefined,
        runtime: undefined,
        viewport: undefined,
      });
    });
  });
});
