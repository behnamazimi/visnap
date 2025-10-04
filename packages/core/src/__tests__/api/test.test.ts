import { describe, it, expect, vi, beforeEach } from "vitest";

import { runTests } from "@/lib/api/test";
import { type TestOptions } from "@/lib/api/test";
import * as configModule from "@/lib/config";

// Mock all dependencies
vi.mock("@/utils/docker", () => ({
  runInDockerWithConfig: vi.fn().mockReturnValue(0),
}));

vi.mock("@/utils/fs", () => ({
  ensureVttDirectories: vi.fn(),
  clearDirectoryFiles: vi.fn().mockResolvedValue(undefined),
  getCurrentDir: vi.fn().mockReturnValue("./visual-testing-tool/current"),
}));

vi.mock("@/utils/logger", () => ({
  default: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/utils/resource-cleanup", () => ({
  globalBrowserManager: {
    removePage: vi.fn(),
    removeBrowser: vi.fn(),
  },
}));

vi.mock("@/utils/report", () => ({
  createEmptyReport: vi.fn().mockResolvedValue({}),
  appendBrowserResults: vi.fn(),
  writeJsonReport: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/utils/server", () => ({
  getStorybookUrl: vi.fn().mockResolvedValue({
    url: "http://localhost:6006",
    server: { close: vi.fn() },
  }),
}));

vi.mock("@/lib/config", async importOriginal => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    loadConfigFile: vi.fn().mockResolvedValue({
      storybook: {
        source: "./storybook-static",
        screenshotTarget: "story-root",
      },
    }),
    resolveBrowsers: vi.fn().mockReturnValue(["chromium"]),
    resolveFinalConfig: vi.fn().mockImplementation(async options => ({
      storybook: {
        source: "./storybook-static",
        screenshotTarget: "story-root",
      },
      ...options,
    })),
  };
});

vi.mock("@/utils/story-utils", () => ({
  extractStories: vi.fn().mockResolvedValue([
    {
      id: "story1",
      title: "Story 1",
      kind: "Example",
      visualTesting: { skip: false },
    },
  ]),
  normalizeStories: vi.fn().mockReturnValue([
    {
      id: "story1",
      title: "Story 1",
      kind: "Example",
      visualTesting: { skip: false },
    },
  ]),
  waitForStorybookReady: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/browser", () => ({
  launchBrowser: vi.fn().mockResolvedValue({ close: vi.fn() }),
  openPage: vi.fn().mockResolvedValue({ close: vi.fn() }),
}));

vi.mock("@/lib/config", () => ({
  resolveFinalConfig: vi.fn().mockResolvedValue({
    storybook: { source: "./storybook-static", screenshotTarget: "story-root" },
    screenshotDir: "visual-testing-tool",
    threshold: 0.1,
    browser: ["chromium"],
    concurrency: 2,
    useDocker: false,
  }),
  resolveBrowsers: vi.fn().mockReturnValue(["chromium"]),
}));

vi.mock("@/lib/test-service", () => ({
  processBrowserForTest: vi.fn().mockResolvedValue({
    browser: "chromium",
    passed: 1,
    total: 1,
    results: [{ id: "story1", match: true, reason: "", diffPercentage: 0 }],
  }),
}));

describe("runTests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should run tests successfully", async () => {
    const result = await runTests();

    expect(result).toEqual({
      passed: true,
      browserResults: [
        {
          browser: "chromium",
          passed: 1,
          total: 1,
          results: [
            { id: "story1", match: true, reason: "", diffPercentage: 0 },
          ],
        },
      ],
      totalStories: 1,
      passedStories: 1,
      exitCode: 0,
    });
  });

  it("should handle Docker execution", async () => {
    const { runInDockerWithConfig } = await import("@/utils/docker");
    const { resolveFinalConfig } = await import("@/lib/config");

    // Mock Docker config
    vi.mocked(resolveFinalConfig).mockResolvedValueOnce({
      storybook: {
        source: "./storybook-static",
        screenshotTarget: "story-root",
      },
      screenshotDir: "visual-testing-tool",
      threshold: 0.1,
      browser: ["chromium"],
      concurrency: 2,
      useDocker: true,
    });

    const result = await runTests({ useDocker: true });

    expect(runInDockerWithConfig).toHaveBeenCalledWith({
      image: "visual-testing-tool/latest",
      config: expect.any(Object),
      command: "test",
    });

    expect(result).toEqual({
      passed: true,
      browserResults: [],
      totalStories: 0,
      passedStories: 0,
      exitCode: 0,
    });
  });

  it("should handle custom Docker image", async () => {
    const { runInDockerWithConfig } = await import("@/utils/docker");
    const { resolveFinalConfig } = await import("@/lib/config");

    // Mock Docker config with custom image
    vi.mocked(resolveFinalConfig).mockResolvedValueOnce({
      storybook: {
        source: "./storybook-static",
        screenshotTarget: "story-root",
      },
      screenshotDir: "visual-testing-tool",
      threshold: 0.1,
      browser: ["chromium"],
      concurrency: 2,
      useDocker: true,
    });

    process.env.VTT_DOCKER_IMAGE = "custom-image:latest";

    await runTests({ useDocker: true });

    expect(runInDockerWithConfig).toHaveBeenCalledWith({
      image: "custom-image:latest",
      config: expect.any(Object),
      command: "test",
    });

    delete process.env.VTT_DOCKER_IMAGE;
  });

  it("should handle failed tests", async () => {
    const { processBrowserForTest } = await import("@/lib/test-service");

    vi.mocked(processBrowserForTest).mockResolvedValueOnce({
      browser: "chromium",
      passed: 0,
      total: 1,
      results: [
        {
          id: "story1",
          match: false,
          reason: "pixel-diff",
          diffPercentage: 5.2,
        },
      ],
    });

    const result = await runTests();

    expect(result).toEqual({
      passed: false,
      browserResults: [
        {
          browser: "chromium",
          passed: 0,
          total: 1,
          results: [
            {
              id: "story1",
              match: false,
              reason: "pixel-diff",
              diffPercentage: 5.2,
            },
          ],
        },
      ],
      totalStories: 1,
      passedStories: 0,
      exitCode: 3,
    });
  });

  it("should handle multiple browsers", async () => {
    const { processBrowserForTest } = await import("@/lib/test-service");
    const { resolveBrowsers } = await import("@/lib/config");

    vi.mocked(resolveBrowsers).mockReturnValue(["chromium", "firefox"]);
    vi.mocked(processBrowserForTest)
      .mockResolvedValueOnce({
        browser: "chromium",
        passed: 1,
        total: 1,
        results: [{ id: "story1", match: true, reason: "", diffPercentage: 0 }],
      })
      .mockResolvedValueOnce({
        browser: "firefox",
        passed: 0,
        total: 1,
        results: [
          {
            id: "story1",
            match: false,
            reason: "pixel-diff",
            diffPercentage: 3.1,
          },
        ],
      });

    const result = await runTests();

    expect(result).toEqual({
      passed: false,
      browserResults: [
        {
          browser: "chromium",
          passed: 1,
          total: 1,
          results: [
            { id: "story1", match: true, reason: "", diffPercentage: 0 },
          ],
        },
        {
          browser: "firefox",
          passed: 0,
          total: 1,
          results: [
            {
              id: "story1",
              match: false,
              reason: "pixel-diff",
              diffPercentage: 3.1,
            },
          ],
        },
      ],
      totalStories: 2,
      passedStories: 1,
      exitCode: 3,
    });
  });

  it("should write JSON report when requested", async () => {
    const { writeJsonReport } = await import("@/utils/report");

    await runTests({ jsonReport: "custom-report.json" });

    expect(writeJsonReport).toHaveBeenCalledWith("custom-report.json", {});
  });

  it("should write default JSON report when jsonReport is true", async () => {
    const { writeJsonReport } = await import("@/utils/report");

    await runTests({ jsonReport: true });

    expect(writeJsonReport).toHaveBeenCalledWith(
      "visual-testing-tool-report.json",
      {}
    );
  });

  it("should not write JSON report when not requested", async () => {
    const { writeJsonReport } = await import("@/utils/report");

    await runTests();

    expect(writeJsonReport).not.toHaveBeenCalled();
  });

  it("should handle Storybook server failure", async () => {
    const { getStorybookUrl } = await import("@/utils/server");

    vi.mocked(getStorybookUrl).mockResolvedValueOnce(null);

    await expect(runTests()).rejects.toThrow(
      "Failed to serve storybook build output"
    );
  });

  it("should pass options to resolveFinalConfig", async () => {
    const { resolveFinalConfig } = await import("@/lib/config");

    const options: TestOptions = {
      include: ["story1"],
      exclude: ["story2"],
      browsers: ["firefox"],
      dryRun: true,
      jsonReport: "test.json",
      useDocker: false,
    };

    await runTests(options);

    expect(resolveFinalConfig).toHaveBeenCalledWith({
      include: ["story1"],
      exclude: ["story2"],
      browser: ["firefox"],
      dryRun: true,
      jsonReport: "test.json",
      useDocker: false,
    });
  });

  it("should cleanup resources properly", async () => {
    const { globalBrowserManager } = await import("@/utils/resource-cleanup");
    const { launchBrowser, openPage } = await import("@/lib/browser");

    const mockBrowser = { close: vi.fn() };
    const mockPage = { close: vi.fn() };

    vi.mocked(launchBrowser).mockResolvedValueOnce(mockBrowser as any);
    vi.mocked(openPage).mockResolvedValueOnce(mockPage as any);

    await runTests();

    expect(globalBrowserManager.removePage).toHaveBeenCalledWith(mockPage);
    expect(globalBrowserManager.removeBrowser).toHaveBeenCalledWith(
      mockBrowser
    );
  });

  it("should accept viewport configuration", async () => {
    const viewportConfig = {
      mobile: { width: 375, height: 667 },
      desktop: { width: 1280, height: 720 },
    };

    const options: TestOptions = {
      viewport: viewportConfig,
    };

    const result = await runTests(options);

    expect(result.passed).toBe(true);
    // The viewport should be passed through to resolveFinalConfig
    expect(vi.mocked(configModule.resolveFinalConfig)).toHaveBeenCalledWith(
      expect.objectContaining({
        viewport: viewportConfig,
      })
    );
  });
});
