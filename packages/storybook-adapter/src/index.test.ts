import { createAdapter } from "./index.js";

import type { PageWithEvaluate, ViewportMap } from "@vividiff/protocol";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all the modules
vi.mock("./server.js", () => ({
  createServerManager: vi.fn(),
}));

vi.mock("./discovery.js", () => ({
  discoverCasesFromBrowser: vi.fn(),
}));

vi.mock("./filtering.js", () => ({
  normalizeStories: vi.fn(),
}));

import { discoverCasesFromBrowser } from "./discovery.js";
import { normalizeStories } from "./filtering.js";
import { createServerManager } from "./server.js";

const mockCreateServerManager = vi.mocked(createServerManager);
const mockDiscoverCasesFromBrowser = vi.mocked(discoverCasesFromBrowser);
const mockNormalizeStories = vi.mocked(normalizeStories);

describe("createAdapter", () => {
  let mockServerManager: any;
  let mockPageCtx: PageWithEvaluate;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServerManager = {
      ensureStarted: vi.fn(),
      getBaseUrl: vi.fn(),
      stop: vi.fn(),
    };

    mockCreateServerManager.mockReturnValue(mockServerManager);

    mockPageCtx = {
      evaluate: vi.fn(),
      close: vi.fn(),
    } as any;
  });

  describe("validation", () => {
    it("should throw error for null options", () => {
      expect(() => createAdapter(null as any)).toThrow(
        "Invalid 'source' provided to createAdapter"
      );
    });

    it("should throw error for undefined options", () => {
      expect(() => createAdapter(undefined as any)).toThrow(
        "Invalid 'source' provided to createAdapter"
      );
    });

    it("should throw error for non-string source", () => {
      expect(() => createAdapter({ source: 123 as any })).toThrow(
        "Invalid 'source' provided to createAdapter"
      );
    });

    it("should throw error for empty source", () => {
      expect(() => createAdapter({ source: "" })).toThrow(
        "Invalid 'source' provided to createAdapter"
      );
    });

    it("should throw error for whitespace-only source", () => {
      expect(() => createAdapter({ source: "   " })).toThrow(
        "Invalid 'source' provided to createAdapter"
      );
    });
  });

  describe("adapter creation", () => {
    it("should create server manager with correct parameters", () => {
      createAdapter({
        source: "/path/to/storybook",
        port: 3000,
      });

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "/path/to/storybook",
        3000
      );
    });

    it("should create server manager without port", () => {
      createAdapter({
        source: "/path/to/storybook",
      });

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "/path/to/storybook",
        undefined
      );
    });

    it("should return adapter with correct name", () => {
      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      expect(adapter.name).toBe("storybook");
    });
  });

  describe("start method", () => {
    it("should start server and return baseUrl", async () => {
      mockServerManager.getBaseUrl.mockReturnValue("http://localhost:4477");

      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      const result = await adapter.start!();

      expect(mockServerManager.ensureStarted).toHaveBeenCalled();
      expect(mockServerManager.getBaseUrl).toHaveBeenCalled();
      expect(result).toEqual({
        baseUrl: "http://localhost:4477",
        initialPageUrl: "http://localhost:4477/iframe.html",
      });
    });
  });

  describe("listCases method", () => {
    it("should throw error when page context is not provided", async () => {
      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await expect(adapter.listCases()).rejects.toThrow(
        "Page context is required for storybook adapter"
      );
    });

    it("should discover and normalize stories", async () => {
      const mockStories = {
        "button-primary": { id: "button-primary", title: "Primary Button" },
      };

      const mockInstances: any[] = [
        {
          id: "button-primary",
          title: "Primary Button",
          caseId: "button-primary",
          variantId: "default",
          url: "http://localhost:4477/iframe.html?id=button-primary",
          screenshotTarget: "#storybook-root",
          viewport: { width: 1024, height: 768 },
        },
      ];

      mockServerManager.getBaseUrl.mockReturnValue("http://localhost:4477");
      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const adapter = createAdapter({
        source: "/path/to/storybook",
        include: ["button*"],
        exclude: ["*test*"],
      });

      const result = await adapter.listCases(mockPageCtx);

      expect(mockDiscoverCasesFromBrowser).toHaveBeenCalledWith(
        mockPageCtx,
        undefined
      );
      expect(mockPageCtx.close).toHaveBeenCalled();
      expect(mockNormalizeStories).toHaveBeenCalledWith(mockStories, {
        include: ["button*"],
        exclude: ["*test*"],
        baseUrl: "http://localhost:4477",
        viewportKeys: ["default"],
        globalViewport: undefined,
      });
      expect(result).toEqual(mockInstances);
    });

    it("should throw error when adapter not started", async () => {
      mockServerManager.getBaseUrl.mockReturnValue(undefined);

      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await expect(adapter.listCases(mockPageCtx)).rejects.toThrow(
        "Adapter not started. Call start() before listCases()."
      );
    });

    it("should handle viewport configuration", async () => {
      const mockStories = {};
      const mockInstances: any[] = [];

      mockServerManager.getBaseUrl.mockReturnValue("http://localhost:4477");
      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const viewportConfig: ViewportMap = {
        mobile: { width: 375, height: 667 },
        desktop: { width: 1920, height: 1080 },
      };

      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await adapter.listCases(mockPageCtx, { viewport: viewportConfig });

      expect(mockNormalizeStories).toHaveBeenCalledWith(mockStories, {
        include: undefined,
        exclude: undefined,
        baseUrl: "http://localhost:4477",
        viewportKeys: ["desktop", "mobile"], // Should be sorted
        globalViewport: viewportConfig,
      });
    });

    it("should handle empty viewport configuration", async () => {
      const mockStories = {};
      const mockInstances: any[] = [];

      mockServerManager.getBaseUrl.mockReturnValue("http://localhost:4477");
      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await adapter.listCases(mockPageCtx, { viewport: {} });

      expect(mockNormalizeStories).toHaveBeenCalledWith(mockStories, {
        include: undefined,
        exclude: undefined,
        baseUrl: "http://localhost:4477",
        viewportKeys: ["default"],
        globalViewport: {},
      });
    });

    it("should close page context even if discovery fails", async () => {
      mockServerManager.getBaseUrl.mockReturnValue("http://localhost:4477");
      mockDiscoverCasesFromBrowser.mockRejectedValue(
        new Error("Discovery failed")
      );

      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await expect(adapter.listCases(mockPageCtx)).rejects.toThrow(
        "Discovery failed"
      );
      expect(mockPageCtx.close).toHaveBeenCalled();
    });

    it("should close page context even if page context has no close method", async () => {
      const pageCtxWithoutClose = {
        evaluate: vi.fn(),
      } as any;

      const mockStories = {};
      const mockInstances: any[] = [];

      mockServerManager.getBaseUrl.mockReturnValue("http://localhost:4477");
      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await adapter.listCases(pageCtxWithoutClose);

      // Should not throw error when close is not available
      expect(mockDiscoverCasesFromBrowser).toHaveBeenCalledWith(
        pageCtxWithoutClose,
        undefined
      );
    });
  });

  describe("stop method", () => {
    it("should stop server manager", async () => {
      const adapter = createAdapter({
        source: "/path/to/storybook",
      });

      await adapter.stop!();

      expect(mockServerManager.stop).toHaveBeenCalled();
    });
  });

  describe("integration", () => {
    it("should work with URL source", () => {
      const adapter = createAdapter({
        source: "https://storybook.example.com",
      });

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "https://storybook.example.com",
        undefined
      );
      expect(adapter.name).toBe("storybook");
    });

    it("should work with all options", () => {
      const adapter = createAdapter({
        source: "/path/to/storybook",
        port: 3000,
        include: ["button*", "input*"],
        exclude: ["*test*"],
      });

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "/path/to/storybook",
        3000
      );
      expect(adapter.name).toBe("storybook");
    });
  });
});
