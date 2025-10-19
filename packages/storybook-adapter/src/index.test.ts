import type { PageWithEvaluate, ViewportMap } from "@visnap/protocol";
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

import {
  createMockStorybookAdapterOptions,
  createMockStories,
  createMockTestCaseInstance,
} from "./__mocks__/mock-factories";
import {
  createMockPageContext,
  createMockServerManager,
} from "./__mocks__/test-utils";
import { discoverCasesFromBrowser } from "./discovery";
import { normalizeStories } from "./filtering";
import { createServerManager } from "./server";

import { createAdapter } from "./index";

const mockCreateServerManager = vi.mocked(createServerManager);
const mockDiscoverCasesFromBrowser = vi.mocked(discoverCasesFromBrowser);
const mockNormalizeStories = vi.mocked(normalizeStories);

describe("createAdapter", () => {
  let mockServerManager: any;
  let mockPageCtx: PageWithEvaluate;

  beforeEach(() => {
    vi.clearAllMocks();

    mockServerManager = createMockServerManager();
    mockCreateServerManager.mockReturnValue(mockServerManager);

    mockPageCtx = createMockPageContext();
  });

  describe("validation", () => {
    it("should throw error for null options", () => {
      expect(() => createAdapter(null as any)).toThrow(
        "Invalid storybook adapter options: must be an object (was null)"
      );
    });

    it("should throw error for undefined options", () => {
      expect(() => createAdapter(undefined as any)).toThrow(
        "Invalid storybook adapter options: must be an object (was undefined)"
      );
    });

    it("should throw error for non-string source", () => {
      expect(() => createAdapter({ source: 123 as any })).toThrow(
        "Invalid storybook adapter options: source must be a string (was a number)"
      );
    });

    it("should throw error for empty source", () => {
      expect(() => createAdapter({ source: "" })).toThrow(
        "Invalid storybook adapter options: source must be non-empty"
      );
    });

    it("should throw error for whitespace-only source", () => {
      expect(() => createAdapter({ source: "   " })).toThrow(
        "Invalid storybook adapter options: source must be non-empty"
      );
    });
  });

  describe("adapter creation", () => {
    it("should create server manager with correct parameters", () => {
      const options = createMockStorybookAdapterOptions({
        source: "/path/to/storybook",
        port: 3000,
      });

      createAdapter(options);

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "/path/to/storybook",
        3000
      );
    });

    it("should create server manager without port", () => {
      const options = createMockStorybookAdapterOptions({
        source: "/path/to/storybook",
      });

      createAdapter(options);

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "/path/to/storybook",
        undefined
      );
    });

    it("should return adapter with correct name", () => {
      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

      expect(adapter.name).toBe("storybook");
    });
  });

  describe("start method", () => {
    it("should start server and return baseUrl", async () => {
      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

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
      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

      await expect(adapter.listCases()).rejects.toThrow(
        "Page context is required for storybook adapter"
      );
    });

    it("should discover and normalize stories", async () => {
      const mockStories = createMockStories();
      const mockInstances = [createMockTestCaseInstance()];

      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const options = createMockStorybookAdapterOptions({
        include: ["button*"],
        exclude: ["*test*"],
      });
      const adapter = createAdapter(options);

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

      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

      await expect(adapter.listCases(mockPageCtx)).rejects.toThrow(
        "Adapter not started. Call start() before listCases()."
      );
    });

    it("should handle viewport configuration", async () => {
      const mockStories = createMockStories();
      const mockInstances = [createMockTestCaseInstance()];

      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const viewportConfig: ViewportMap = {
        mobile: { width: 375, height: 667 },
        desktop: { width: 1920, height: 1080 },
      };

      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

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
      const mockStories = createMockStories();
      const mockInstances = [createMockTestCaseInstance()];

      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

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
      mockDiscoverCasesFromBrowser.mockRejectedValue(
        new Error("Discovery failed")
      );

      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

      await expect(adapter.listCases(mockPageCtx)).rejects.toThrow(
        "Discovery failed"
      );
      expect(mockPageCtx.close).toHaveBeenCalled();
    });

    it("should close page context even if page context has no close method", async () => {
      const pageCtxWithoutClose = createMockPageContext({ close: undefined });
      const mockStories = createMockStories();
      const mockInstances = [createMockTestCaseInstance()];

      mockDiscoverCasesFromBrowser.mockResolvedValue(mockStories);
      mockNormalizeStories.mockReturnValue(mockInstances);

      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

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
      const options = createMockStorybookAdapterOptions();
      const adapter = createAdapter(options);

      await adapter.stop!();

      expect(mockServerManager.stop).toHaveBeenCalled();
    });
  });

  describe("integration", () => {
    it("should work with URL source", () => {
      const options = createMockStorybookAdapterOptions({
        source: "https://storybook.example.com",
      });
      const adapter = createAdapter(options);

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "https://storybook.example.com",
        undefined
      );
      expect(adapter.name).toBe("storybook");
    });

    it("should work with all options", () => {
      const options = createMockStorybookAdapterOptions({
        source: "/path/to/storybook",
        port: 3000,
        include: ["button*", "input*"],
        exclude: ["*test*"],
      });
      const adapter = createAdapter(options);

      expect(mockCreateServerManager).toHaveBeenCalledWith(
        "/path/to/storybook",
        3000
      );
      expect(adapter.name).toBe("storybook");
    });
  });
});
