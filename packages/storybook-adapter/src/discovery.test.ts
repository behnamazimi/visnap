import type { PageWithEvaluate } from "@visual-testing-tool/protocol";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { discoverCasesFromBrowser } from "./discovery.js";

// Mock the utils module
vi.mock("./utils.js", () => ({
  withTimeout: vi.fn(promise => promise), // Just pass through for most tests
}));

import { withTimeout } from "./utils.js";

const mockWithTimeout = vi.mocked(withTimeout);

describe("discovery", () => {
  let mockPageCtx: PageWithEvaluate;
  let mockEvaluate: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEvaluate = vi.fn();
    mockPageCtx = {
      evaluate: mockEvaluate,
      close: vi.fn(),
    } as any;
  });

  describe("discoverCasesFromBrowser", () => {
    it("should throw error if page context doesn't support evaluate", async () => {
      const invalidPageCtx = {} as PageWithEvaluate;

      await expect(discoverCasesFromBrowser(invalidPageCtx)).rejects.toThrow(
        "Page context does not support evaluate()"
      );
    });

    it("should discover stories successfully", async () => {
      const mockStories = {
        "button-primary": { id: "button-primary", title: "Primary Button" },
        "button-secondary": {
          id: "button-secondary",
          title: "Secondary Button",
        },
      };

      // Mock window.__STORYBOOK_PREVIEW__
      const mockStorybook = {
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockResolvedValue(mockStories),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        // Mock the browser environment
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      const result = await discoverCasesFromBrowser(mockPageCtx);

      expect(result).toEqual(mockStories);
      expect(mockStorybook.ready).toHaveBeenCalled();
      expect(mockStorybook.extract).toHaveBeenCalled();
    });

    it("should handle storybook without ready method", async () => {
      const mockStories = {
        "button-primary": { id: "button-primary", title: "Primary Button" },
      };

      const mockStorybook = {
        extract: vi.fn().mockResolvedValue(mockStories),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      const result = await discoverCasesFromBrowser(mockPageCtx);

      expect(result).toEqual(mockStories);
      expect(mockStorybook.extract).toHaveBeenCalled();
    });

    it("should throw error if storybook preview not found", async () => {
      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {} as any;
        return fn();
      });

      await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
        "Storybook preview object not found on window"
      );
    });

    it("should throw error if extract method is not available", async () => {
      const mockStorybook = {
        ready: vi.fn().mockResolvedValue(undefined),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
        "Storybook extract() is unavailable"
      );
    });

    it("should handle ready method rejection", async () => {
      const mockStorybook = {
        ready: vi.fn().mockRejectedValue(new Error("Ready failed")),
        extract: vi.fn().mockResolvedValue({}),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
        "Ready failed"
      );
    });

    it("should handle extract method rejection", async () => {
      const mockStorybook = {
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockRejectedValue(new Error("Extract failed")),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
        "Extract failed"
      );
    });

    it("should retry on failure with exponential backoff", async () => {
      const mockStories = {
        "button-primary": { id: "button-primary", title: "Primary Button" },
      };

      const mockStorybook = {
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi
          .fn()
          .mockRejectedValueOnce(new Error("First attempt failed"))
          .mockRejectedValueOnce(new Error("Second attempt failed"))
          .mockResolvedValue(mockStories),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      // Mock setTimeout to make tests faster
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn: () => void) => {
        fn();
        return 1 as any;
      }) as any;

      const result = await discoverCasesFromBrowser(mockPageCtx);

      expect(result).toEqual(mockStories);
      expect(mockStorybook.extract).toHaveBeenCalledTimes(3);
      expect(global.setTimeout).toHaveBeenCalledTimes(2); // Two retries

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it("should fail after max retries", async () => {
      const mockStorybook = {
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockRejectedValue(new Error("Always fails")),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      // Mock setTimeout to make tests faster
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((fn: () => void) => {
        fn();
        return 1 as any;
      }) as any;

      await expect(discoverCasesFromBrowser(mockPageCtx)).rejects.toThrow(
        "Always fails"
      );
      expect(mockStorybook.extract).toHaveBeenCalledTimes(3); // Initial + 2 retries

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
    });

    it("should apply timeout to evaluation", async () => {
      const mockStories = { test: { id: "test" } };
      const mockStorybook = {
        ready: vi.fn().mockResolvedValue(undefined),
        extract: vi.fn().mockResolvedValue(mockStories),
      };

      mockEvaluate.mockImplementation((fn: () => any) => {
        global.window = {
          __STORYBOOK_PREVIEW__: mockStorybook,
        } as any;
        return fn();
      });

      await discoverCasesFromBrowser(mockPageCtx);

      expect(mockWithTimeout).toHaveBeenCalledWith(
        expect.any(Promise),
        15000,
        "Story discovery timed out"
      );
    });
  });
});
