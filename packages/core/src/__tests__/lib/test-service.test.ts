import { describe, it, expect, vi, beforeEach } from "vitest";

import { type VTTConfig, type BrowserName } from "../../lib/config";
import { processBrowserForTest } from "../../lib/test-service";
import { type VTTStory } from "../../types";

// Mock dependencies
vi.mock("../../utils/story-runner", () => ({
  runStoriesOnBrowser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../lib/compare", () => ({
  compareBaseAndCurrentWithStories: vi.fn().mockResolvedValue([
    { id: "story1", match: true, reason: "", diffPercentage: 0 },
    { id: "story2", match: false, reason: "pixel-diff", diffPercentage: 5.2 },
  ]),
}));

vi.mock("../../lib/storiesFilter", () => ({
  createStoryFilter: vi.fn().mockReturnValue(() => true),
}));

vi.mock("../../utils/config-resolver", () => ({
  shouldProcessStoryForBrowser: vi.fn().mockReturnValue(true),
}));

vi.mock("../../utils/logger", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    dim: vi.fn(),
  },
}));

describe("processBrowserForTest", () => {
  const mockConfig: VTTConfig = {
    storybook: {
      source: "./storybook-static",
      screenshotTarget: "story-root",
    },
    screenshotDir: "visual-testing-tool",
    threshold: 0.1,
    browser: "chromium",
    concurrency: 2,
  };

  const mockStories: VTTStory[] = [
    {
      id: "story1",
      title: "Story 1",
      kind: "Example",
      visualTesting: { skip: false, threshold: 0.1 },
    },
    {
      id: "story2",
      title: "Story 2",
      kind: "Example",
      visualTesting: { skip: false, threshold: 0.1 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process browser and return test results", async () => {
    const result = await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      {}
    );

    expect(result).toEqual({
      browser: "chromium",
      passed: 1,
      total: 2,
      results: [
        { id: "story1", match: true, reason: "", diffPercentage: 0 },
        {
          id: "story2",
          match: false,
          reason: "pixel-diff",
          diffPercentage: 5.2,
        },
      ],
    });
  });

  it("should call runStoriesOnBrowser with correct parameters", async () => {
    const { runStoriesOnBrowser } = await import("../../utils/story-runner");

    await processBrowserForTest(
      "firefox" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      {}
    );

    expect(runStoriesOnBrowser).toHaveBeenCalledWith({
      mode: "test",
      sbUrl: "http://localhost:6006",
      browser: "firefox",
      config: mockConfig,
    });
  });

  it("should filter stories correctly", async () => {
    const { createStoryFilter } = await import("../../lib/storiesFilter");
    await import("../../utils/config-resolver");

    await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      { include: ["story1"], exclude: ["story2"] }
    );

    expect(createStoryFilter).toHaveBeenCalledWith({
      include: mockConfig.include,
      exclude: mockConfig.exclude,
    });
  });

  it("should call compareBaseAndCurrentWithStories with filtered stories", async () => {
    const { compareBaseAndCurrentWithStories } = await import(
      "../../lib/compare"
    );

    await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      {}
    );

    expect(compareBaseAndCurrentWithStories).toHaveBeenCalledWith(
      mockConfig,
      mockStories
    );
  });

  it("should skip stories with visualTesting.skip = true", async () => {
    const storiesWithSkip: VTTStory[] = [
      {
        id: "story1",
        title: "Story 1",
        kind: "Example",
        visualTesting: { skip: false },
      },
      {
        id: "story2",
        title: "Story 2",
        kind: "Example",
        visualTesting: { skip: true },
      },
    ];

    const { compareBaseAndCurrentWithStories } = await import(
      "../../lib/compare"
    );

    await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      storiesWithSkip,
      {}
    );

    // Should only process non-skipped stories
    expect(compareBaseAndCurrentWithStories).toHaveBeenCalledWith(
      mockConfig,
      [storiesWithSkip[0]] // Only the non-skipped story
    );
  });

  it("should log results correctly", async () => {
    const { default: log } = await import("../../utils/logger");

    await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      {}
    );

    expect(log.success).toHaveBeenCalledWith("Passed: [chromium] story1");
    expect(log.error).toHaveBeenCalledWith("Failed: [chromium] story2");
    expect(log.dim).toHaveBeenCalledWith("  pixel-diff (5.2% difference)");
  });

  it("should handle stories without diffPercentage", async () => {
    const { compareBaseAndCurrentWithStories } = await import(
      "../../lib/compare"
    );
    const { default: log } = await import("../../utils/logger");

    // Mock compare to return result without diffPercentage
    vi.mocked(compareBaseAndCurrentWithStories).mockResolvedValueOnce([
      { id: "story1", match: false, reason: "file-not-found" },
    ]);

    await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      {}
    );

    expect(log.error).toHaveBeenCalledWith("Failed: [chromium] story1");
    expect(log.dim).toHaveBeenCalledWith("  file-not-found");
  });

  it("should return correct passed/total counts", async () => {
    const { compareBaseAndCurrentWithStories } = await import(
      "../../lib/compare"
    );

    // Mock different results
    vi.mocked(compareBaseAndCurrentWithStories).mockResolvedValueOnce([
      { id: "story1", match: true, reason: "" },
      { id: "story2", match: true, reason: "" },
      { id: "story3", match: false, reason: "pixel-diff" },
    ]);

    const result = await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      mockStories,
      {}
    );

    expect(result.passed).toBe(2);
    expect(result.total).toBe(3);
  });

  it("should handle empty story list", async () => {
    const { compareBaseAndCurrentWithStories } = await import(
      "../../lib/compare"
    );

    // Mock compare to return empty results for empty story list
    vi.mocked(compareBaseAndCurrentWithStories).mockResolvedValueOnce([]);

    const result = await processBrowserForTest(
      "chromium" as BrowserName,
      "http://localhost:6006",
      mockConfig,
      [],
      {}
    );

    expect(result).toEqual({
      browser: "chromium",
      passed: 0,
      total: 0,
      results: [],
    });
  });
});
