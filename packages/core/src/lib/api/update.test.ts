import { describe, it, expect, vi, beforeEach } from "vitest";

import { updateBaseline, updateBaselineCli } from "./update";

import { createMockConfig } from "@/__mocks__/mock-factories";
import { resolveEffectiveConfig } from "@/lib/config";
import { executeTestRun } from "@/utils/testcase-runner";

// Mock dependencies
vi.mock("@/lib/config", () => ({
  resolveEffectiveConfig: vi.fn(),
}));

vi.mock("@/utils/testcase-runner", () => ({
  executeTestRun: vi.fn(),
}));

describe("update API", () => {
  const mockResolveEffectiveConfig = vi.mocked(resolveEffectiveConfig);
  const mockExecuteTestRun = vi.mocked(executeTestRun);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateBaseline", () => {
    it("should update baseline with default options", async () => {
      const mockConfig = createMockConfig();
      const mockOutcome = {
        passed: 5,
        total: 5,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaseline({});

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, undefined);
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should update baseline with custom options", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
        adapters: {
          browser: { name: "firefox" },
          testCase: [{ name: "storybook" }],
        },
      };
      const mockConfig = createMockConfig(customOptions);
      const mockOutcome = {
        passed: 3,
        total: 3,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaseline(customOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        undefined
      );
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should handle empty options", async () => {
      const mockConfig = createMockConfig();
      const mockOutcome = {
        passed: 1,
        total: 1,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaseline({});

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, undefined);
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should handle config resolution errors", async () => {
      const error = new Error("Config not found");
      mockResolveEffectiveConfig.mockRejectedValue(error);

      await expect(updateBaseline({})).rejects.toThrow("Config not found");
    });

    it("should handle test run errors", async () => {
      const mockConfig = createMockConfig();
      const error = new Error("Test run failed");

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockRejectedValue(error);

      await expect(updateBaseline({})).rejects.toThrow("Test run failed");
    });

    it("should handle partial options", async () => {
      const partialOptions = {
        screenshotDir: "custom-screenshots",
      };
      const mockConfig = createMockConfig(partialOptions);
      const mockOutcome = {
        passed: 2,
        total: 2,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaseline(partialOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        partialOptions,
        undefined
      );
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });
  });

  describe("updateBaselineCli", () => {
    it("should update baseline with CLI options", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
      };
      const cliOptions = {
        include: ["button*"],
        exclude: ["page*"],
      };
      const mockConfig = createMockConfig(customOptions);
      const mockOutcome = {
        passed: 3,
        total: 3,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaselineCli(customOptions, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        cliOptions
      );
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should update baseline with empty CLI options", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
      };
      const cliOptions = {};
      const mockConfig = createMockConfig(customOptions);
      const mockOutcome = {
        passed: 1,
        total: 1,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaselineCli(customOptions, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        cliOptions
      );
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should update baseline with default options and CLI options", async () => {
      const cliOptions = {
        include: ["button*"],
        exclude: ["page*"],
      };
      const mockConfig = createMockConfig();
      const mockOutcome = {
        passed: 2,
        total: 2,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaselineCli({}, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, cliOptions);
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should handle CLI options with include only", async () => {
      const cliOptions = {
        include: ["button*"],
      };
      const mockConfig = createMockConfig();
      const mockOutcome = {
        passed: 1,
        total: 1,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaselineCli({}, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, cliOptions);
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should handle CLI options with exclude only", async () => {
      const cliOptions = {
        exclude: ["page*"],
      };
      const mockConfig = createMockConfig();
      const mockOutcome = {
        passed: 1,
        total: 1,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      await updateBaselineCli({}, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, cliOptions);
      expect(mockExecuteTestRun).toHaveBeenCalledWith(mockConfig, "update");
    });

    it("should handle config resolution errors with CLI options", async () => {
      const cliOptions = {
        include: ["button*"],
      };
      const error = new Error("Config not found");
      mockResolveEffectiveConfig.mockRejectedValue(error);

      await expect(updateBaselineCli({}, cliOptions)).rejects.toThrow(
        "Config not found"
      );
    });

    it("should handle test run errors with CLI options", async () => {
      const cliOptions = {
        include: ["button*"],
      };
      const mockConfig = createMockConfig();
      const error = new Error("Test run failed");

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockRejectedValue(error);

      await expect(updateBaselineCli({}, cliOptions)).rejects.toThrow(
        "Test run failed"
      );
    });
  });

  describe("internal functions", () => {
    it("should call internal function with correct parameters", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
      };
      const cliOptions = {
        include: ["button*"],
      };
      const mockConfig = createMockConfig(customOptions);
      const mockOutcome = {
        passed: 1,
        total: 1,
        captureFailures: 0,
        failedDiffs: 0,
        failedMissingCurrent: 0,
        failedMissingBase: 0,
        failedErrors: 0,
      };

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockExecuteTestRun.mockResolvedValue({
        outcome: mockOutcome,
        failures: [],
        captureFailures: [],
      });

      // Test that both functions call the same internal function
      await updateBaseline(customOptions);
      await updateBaselineCli(customOptions, cliOptions);

      expect(mockResolveEffectiveConfig).toHaveBeenCalledTimes(2);
      expect(mockExecuteTestRun).toHaveBeenCalledTimes(2);
      expect(mockExecuteTestRun).toHaveBeenNthCalledWith(
        1,
        mockConfig,
        "update"
      );
      expect(mockExecuteTestRun).toHaveBeenNthCalledWith(
        2,
        mockConfig,
        "update"
      );
    });
  });
});
