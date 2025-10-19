import type { PageWithEvaluate } from "@visnap/protocol";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockStories } from "./__mocks__/mock-factories";
import {
  createMockPageContext,
  setupStorybookWindow,
  createMockStorybook,
} from "./__mocks__/test-utils";
import { discoverCasesFromBrowser } from "./discovery";

// Mock the utils module
vi.mock("./utils.js", () => ({
  withTimeout: vi.fn(promise => promise), // Just pass through for most tests
}));

import { withTimeout } from "./utils";

const mockWithTimeout = vi.mocked(withTimeout);

describe("discovery", () => {
  let mockPageCtx: PageWithEvaluate;
  let mockEvaluate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEvaluate = vi.fn();
    mockPageCtx = createMockPageContext({ evaluate: mockEvaluate });
  });

  describe("discoverCasesFromBrowser", () => {
    it("should throw error if page context doesn't support evaluate", async () => {
      const invalidPageCtx = {} as PageWithEvaluate;

      await expect(discoverCasesFromBrowser(invalidPageCtx)).rejects.toThrow(
        "Page context does not support evaluate()"
      );
    });

    it("should discover stories successfully", async () => {
      const mockStories = createMockStories();
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockResolvedValue(mockStories),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        const result = await discoverCasesFromBrowser(mockPageCtx);
        expect(result).toEqual(mockStories);
        expect(mockStorybook.ready).toHaveBeenCalled();
        expect(mockStorybook.extract).toHaveBeenCalled();
      } finally {
        cleanup();
      }
    });

    it("should handle storybook without ready method", async () => {
      const mockStories = createMockStories();
      const mockStorybook = createMockStorybook({
        ready: undefined,
        extract: vi.fn().mockResolvedValue(mockStories),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        const result = await discoverCasesFromBrowser(mockPageCtx);
        expect(result).toEqual(mockStories);
        expect(mockStorybook.extract).toHaveBeenCalled();
      } finally {
        cleanup();
      }
    });

    it("should throw error if storybook preview not found", async () => {
      const cleanup = setupStorybookWindow(undefined);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
          "Storybook preview object not found on window"
        );
      } finally {
        cleanup();
      }
    });

    it("should throw error if extract method is not available", async () => {
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: undefined,
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
          "Storybook extract() is unavailable"
        );
      } finally {
        cleanup();
      }
    });

    it("should handle ready method rejection", async () => {
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockRejectedValue(new Error("Ready failed")),
        extract: vi.fn().mockResolvedValue({}),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
          "Ready failed"
        );
      } finally {
        cleanup();
      }
    });

    it("should handle extract method rejection", async () => {
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockRejectedValue(new Error("Extract failed")),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
          "Extract failed"
        );
      } finally {
        cleanup();
      }
    });

    it("should retry on failure with exponential backoff", async () => {
      const mockStories = createMockStories();
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi
          .fn()
          .mockRejectedValueOnce(new Error("First attempt failed"))
          .mockRejectedValueOnce(new Error("Second attempt failed"))
          .mockResolvedValue(mockStories),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      // Mock setTimeout to make tests faster
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn: () => void) => {
        fn();
        return 1 as any;
      }) as any;

      try {
        const result = await discoverCasesFromBrowser(mockPageCtx);

        expect(result).toEqual(mockStories);
        expect(mockStorybook.extract).toHaveBeenCalledTimes(3);
        expect(global.setTimeout).toHaveBeenCalledTimes(2); // Two retries
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
        cleanup();
      }
    });

    it("should fail after max retries", async () => {
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockRejectedValue(new Error("Always fails")),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      // Mock setTimeout to make tests faster
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn: () => void) => {
        fn();
        return 1 as any;
      }) as any;

      try {
        await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
          "Always fails"
        );
        expect(mockStorybook.extract).toHaveBeenCalledTimes(3); // Initial + 2 retries
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
        cleanup();
      }
    });

    it("should handle non-Error exception in retry logic", async () => {
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockRejectedValue("string error"), // Non-Error exception
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      // Mock setTimeout to make tests faster
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn: () => void) => {
        fn();
        return 1 as any;
      }) as any;

      try {
        await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
          "string error"
        );
        expect(mockStorybook.extract).toHaveBeenCalledTimes(3); // Initial + 2 retries
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
        cleanup();
      }
    });

    it("should apply timeout to evaluation", async () => {
      const mockStories = createMockStories();
      const mockStorybook = createMockStorybook({
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockResolvedValue(mockStories),
      });

      const cleanup = setupStorybookWindow(mockStorybook);
      mockEvaluate.mockImplementation((fn: () => any) => fn());

      try {
        await discoverCasesFromBrowser(mockPageCtx);

        expect(mockWithTimeout).toHaveBeenCalledWith(
          expect.any(Promise),
          15000,
          "Story discovery timed out"
        );
      } finally {
        cleanup();
      }
    });
  });
});
