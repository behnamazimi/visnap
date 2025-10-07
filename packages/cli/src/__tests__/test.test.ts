import { describe, it, expect, vi, beforeEach } from "vitest";

import { command } from "../commands/test";

const testCommand = command.handler;

// Mock dependencies
vi.mock("@visual-testing-tool/core", () => ({
  runTests: vi.fn(),
  getErrorMessage: vi.fn().mockImplementation(error => error.message),
  log: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("testCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.argv
    process.argv = ["node", "visual-testing-tool", "test"];
  });

  it("should run tests successfully", async () => {
    const { runTests, log } = await import("@visual-testing-tool/core");

    vi.mocked(runTests).mockResolvedValueOnce({
      passed: true,
      browserResults: [
        {
          browser: "chromium",
          passed: 2,
          total: 2,
          results: [],
        },
      ],
      totalStories: 2,
      passedStories: 2,
      exitCode: 0,
    });

    await testCommand({
      include: "story1",
      exclude: "story2",
      dryRun: false,
      json: "report.json",
    });

    expect(runTests).toHaveBeenCalledWith({
      include: ["story1"],
      exclude: ["story2"],
      dryRun: false,
      jsonReport: "report.json",
      useDocker: false,
    });

    expect(log.info).toHaveBeenCalledWith("[chromium] 2 out of 2 tests passed");
    expect(log.success).toHaveBeenCalledWith("All test cases are matching");
    expect(process.exitCode).toBe(0);
  });

  it("should handle failed tests", async () => {
    const { runTests, log } = await import("@visual-testing-tool/core");

    vi.mocked(runTests).mockResolvedValueOnce({
      passed: false,
      browserResults: [
        {
          browser: "chromium",
          passed: 1,
          total: 2,
          results: [],
        },
        {
          browser: "firefox",
          passed: 0,
          total: 2,
          results: [],
        },
      ],
      totalStories: 4,
      passedStories: 1,
      exitCode: 3,
    });

    await testCommand({ dryRun: false });

    expect(log.info).toHaveBeenCalledWith("[chromium] 1 out of 2 tests passed");
    expect(log.info).toHaveBeenCalledWith("[firefox] 0 out of 2 tests passed");
    expect(log.error).toHaveBeenCalledWith("Some test cases are not matching");
    expect(process.exitCode).toBe(3);
  });

  it("should handle Docker flag", async () => {
    const { runTests } = await import("@visual-testing-tool/core");

    process.argv = ["node", "visual-testing-tool", "test", "--docker"];

    await testCommand({ docker: true });

    expect(runTests).toHaveBeenCalledWith({
      include: undefined,
      exclude: undefined,
      dryRun: undefined,
      jsonReport: undefined,
      useDocker: true,
    });
  });

  it("should handle errors gracefully", async () => {
    const { runTests, log, getErrorMessage } = await import(
      "@visual-testing-tool/core"
    );

    const error = new Error("Test failed");
    vi.mocked(runTests).mockRejectedValueOnce(error);
    vi.mocked(getErrorMessage).mockReturnValueOnce("Test failed");

    await testCommand({ dryRun: false });

    expect(log.error).toHaveBeenCalledWith("Error running tests: Test failed");
    expect(process.exitCode).toBe(1);
  });

  it("should handle multiple browsers in results", async () => {
    const { runTests, log } = await import("@visual-testing-tool/core");

    vi.mocked(runTests).mockResolvedValueOnce({
      passed: false,
      browserResults: [
        {
          browser: "chromium",
          passed: 2,
          total: 2,
          results: [],
        },
        {
          browser: "firefox",
          passed: 2,
          total: 2,
          results: [],
        },
        {
          browser: "webkit",
          passed: 1,
          total: 2,
          results: [],
        },
      ],
      totalStories: 6,
      passedStories: 5,
      exitCode: 3,
    });

    await testCommand({ dryRun: false });

    expect(log.info).toHaveBeenCalledWith("[chromium] 2 out of 2 tests passed");
    expect(log.info).toHaveBeenCalledWith("[firefox] 2 out of 2 tests passed");
    expect(log.info).toHaveBeenCalledWith("[webkit] 1 out of 2 tests passed");
    expect(log.error).toHaveBeenCalledWith("Some test cases are not matching");
    expect(process.exitCode).toBe(3);
  });

  it("should handle empty browser results", async () => {
    const { runTests, log } = await import("@visual-testing-tool/core");

    vi.mocked(runTests).mockResolvedValueOnce({
      passed: true,
      browserResults: [],
      totalStories: 0,
      passedStories: 0,
      exitCode: 0,
    });

    await testCommand({ dryRun: false });

    expect(log.success).toHaveBeenCalledWith("All test cases are matching");
    expect(process.exitCode).toBe(0);
  });
});
