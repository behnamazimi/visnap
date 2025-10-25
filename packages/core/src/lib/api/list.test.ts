import { describe, it, expect, vi, beforeEach } from "vitest";

import { listTestCases, listTestCasesCli, type ListResult } from "./list";

import {
  createMockBrowserAdapter,
  createMockTestCaseAdapter,
} from "@/__mocks__/mock-adapters";
import {
  createMockConfig,
  createMockTestCase,
  createMockViewport,
} from "@/__mocks__/mock-factories";
import {
  loadBrowserAdapter,
  loadAllTestCaseAdapters,
} from "@/browser/adapter-loader";
import { parseBrowsersFromConfig } from "@/browser/browser-config";
import { resolveEffectiveConfig } from "@/lib/config";
import { discoverCasesFromAllAdapters } from "@/test/test-discovery";

// Mock dependencies
const mockGetAdapter = vi.fn();
const mockDisposeAll = vi.fn();

vi.mock("@/browser/adapter-loader", () => {
  class BrowserAdapterPool {
    getAdapter = mockGetAdapter;
    disposeAll = mockDisposeAll;
  }
  return {
    loadBrowserAdapter: vi.fn(),
    loadAllTestCaseAdapters: vi.fn(),
    BrowserAdapterPool,
  };
});

vi.mock("@/browser/browser-config", () => ({
  parseBrowsersFromConfig: vi.fn(),
}));

vi.mock("@/lib/config", () => ({
  resolveEffectiveConfig: vi.fn(),
}));

vi.mock("@/test/test-discovery", () => ({
  discoverCasesFromAllAdapters: vi.fn(),
}));

describe("list API", () => {
  const mockLoadBrowserAdapter = vi.mocked(loadBrowserAdapter);
  const mockLoadAllTestCaseAdapters = vi.mocked(loadAllTestCaseAdapters);
  const mockParseBrowsersFromConfig = vi.mocked(parseBrowsersFromConfig);
  const mockResolveEffectiveConfig = vi.mocked(resolveEffectiveConfig);
  const mockDiscoverCasesFromAllAdapters = vi.mocked(
    discoverCasesFromAllAdapters
  );
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock method implementations
    mockGetAdapter.mockResolvedValue(createMockBrowserAdapter());
    mockDisposeAll.mockResolvedValue(undefined);
  });

  describe("listTestCases", () => {
    it("should list test cases with default options", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({ caseId: "input", variantId: "default" }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      // Make sure the pool returns the expected adapter
      mockGetAdapter.mockResolvedValue(mockBrowserAdapter);

      const result = await listTestCases();

      expect(result).toEqual({
        testCases: mockTestCases,
        summary: {
          total: 2,
          browsers: ["chromium"],
          viewports: ["1920x1080"],
        },
      });

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith({}, undefined);
      expect(mockLoadAllTestCaseAdapters).toHaveBeenCalledWith(
        mockConfig.adapters
      );
      expect(mockParseBrowsersFromConfig).toHaveBeenCalledWith(
        mockConfig.adapters
      );
      expect(mockDiscoverCasesFromAllAdapters).toHaveBeenCalledWith(
        mockTestCaseAdapters,
        mockBrowserAdapter,
        mockConfig.viewport,
        mockBrowsers
      );
      // Verify BrowserAdapterPool was used (getAdapter was called)
      expect(mockGetAdapter).toHaveBeenCalledWith(
        "chromium",
        undefined,
        expect.any(Function)
      );
      expect(mockDisposeAll).toHaveBeenCalledTimes(1);
    });

    it("should list test cases with custom options", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
        adapters: {
          browser: { name: "firefox" },
          testCase: [{ name: "storybook" }],
        },
      };
      const mockConfig = createMockConfig(customOptions);
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "firefox" as const }];
      const mockTestCases = [
        createMockTestCase({
          caseId: "button",
          variantId: "default",
          browser: "firefox",
        }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCases(customOptions);

      expect(result).toEqual({
        testCases: mockTestCases,
        summary: {
          total: 1,
          browsers: ["firefox"],
          viewports: ["1920x1080"],
        },
      });

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        undefined
      );
    });

    it("should handle multiple browsers", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [
        { name: "chromium" as const },
        { name: "firefox" as const },
        { name: "webkit" as const },
      ];
      const mockTestCases = [
        createMockTestCase({
          caseId: "button",
          variantId: "default",
          browser: "chromium",
        }),
        createMockTestCase({
          caseId: "button",
          variantId: "default",
          browser: "firefox",
        }),
        createMockTestCase({
          caseId: "button",
          variantId: "default",
          browser: "webkit",
        }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCases();

      expect(result.summary.browsers).toEqual([
        "chromium",
        "firefox",
        "webkit",
      ]);
      expect(result.summary.total).toBe(3);
    });

    it("should handle multiple viewports", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({
          caseId: "button",
          variantId: "default",
          viewport: { width: 1920, height: 1080 },
        }),
        createMockTestCase({
          caseId: "button",
          variantId: "mobile",
          viewport: { width: 375, height: 667 },
        }),
        createMockTestCase({
          caseId: "button",
          variantId: "tablet",
          viewport: { width: 768, height: 1024 },
        }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCases();

      expect(result.summary.viewports).toEqual([
        "1920x1080",
        "375x667",
        "768x1024",
      ]);
      expect(result.summary.total).toBe(3);
    });

    it("should handle empty test cases", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue([]);

      const result = await listTestCases();

      expect(result).toEqual({
        testCases: [],
        summary: {
          total: 0,
          browsers: [],
          viewports: [],
        },
      });
    });

    it("should handle test cases without browser property", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({
          caseId: "input",
          variantId: "default",
          viewport: createMockViewport(),
        }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCases();

      expect(result.summary.browsers).toEqual(["chromium"]);
      expect(result.summary.total).toBe(2);
    });

    it("should handle test cases without viewport property", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({
          caseId: "input",
          variantId: "default",
          browser: "chromium",
        }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCases();

      expect(result.summary.viewports).toEqual(["1920x1080"]);
      expect(result.summary.total).toBe(2);
    });
  });

  describe("listTestCasesCli", () => {
    it("should list test cases with CLI options", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
      };
      const cliOptions = {
        include: ["button*"],
        exclude: ["page*"],
      };
      const mockConfig = createMockConfig(customOptions);
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCasesCli(customOptions, cliOptions);

      expect(result).toEqual({
        testCases: mockTestCases,
        summary: {
          total: 1,
          browsers: ["chromium"],
          viewports: ["1920x1080"],
        },
      });

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        cliOptions
      );
    });

    it("should handle empty CLI options", async () => {
      const customOptions = {
        screenshotDir: "custom-screenshots",
      };
      const cliOptions = {};
      const mockConfig = createMockConfig(customOptions);
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);

      const result = await listTestCasesCli(customOptions, cliOptions);

      expect(result).toEqual({
        testCases: mockTestCases,
        summary: {
          total: 1,
          browsers: ["chromium"],
          viewports: ["1920x1080"],
        },
      });

      expect(mockResolveEffectiveConfig).toHaveBeenCalledWith(
        customOptions,
        cliOptions
      );
    });
  });

  describe("Resource Management", () => {
    it("should use BrowserAdapterPool for proper resource management", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);
      mockGetAdapter.mockResolvedValue(mockBrowserAdapter);

      await listTestCases();

      // Verify BrowserAdapterPool was used (getAdapter was called)
      // Verify getAdapter was called with correct parameters
      expect(mockGetAdapter).toHaveBeenCalledWith(
        "chromium",
        undefined,
        expect.any(Function)
      );

      // Verify disposeAll was called for cleanup
      expect(mockDisposeAll).toHaveBeenCalledTimes(1);
    });

    it("should call disposeAll even when discovery fails", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const discoveryError = new Error("Discovery failed");

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockRejectedValue(discoveryError);
      mockGetAdapter.mockResolvedValue(mockBrowserAdapter);

      await expect(listTestCases()).rejects.toThrow("Discovery failed");

      // Verify disposeAll was still called for cleanup even on error
      expect(mockDisposeAll).toHaveBeenCalledTimes(1);
    });

    it("should call disposeAll even when getAdapter fails", async () => {
      const mockConfig = createMockConfig();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const adapterError = new Error("Adapter failed");

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockGetAdapter.mockRejectedValue(adapterError);

      await expect(listTestCases()).rejects.toThrow("Adapter failed");

      // Verify disposeAll was still called for cleanup even on error
      expect(mockDisposeAll).toHaveBeenCalledTimes(1);
    });

    it("should handle disposeAll errors gracefully", async () => {
      const mockConfig = createMockConfig();
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [{ name: "chromium" as const }];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);
      mockGetAdapter.mockResolvedValue(mockBrowserAdapter);
      mockDisposeAll.mockRejectedValue(new Error("Dispose failed"));

      // Should throw when disposeAll fails
      await expect(listTestCases()).rejects.toThrow("Dispose failed");

      // Verify disposeAll was attempted
      expect(mockDisposeAll).toHaveBeenCalledTimes(1);
    });

    it("should pass correct browser options to getAdapter", async () => {
      const mockConfig = createMockConfig({
        adapters: {
          browser: {
            name: "@visnap/playwright-adapter",
            options: { headless: false },
          },
          testCase: [{ name: "@visnap/storybook-adapter" }],
        },
      });
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockTestCaseAdapters = [createMockTestCaseAdapter()];
      const mockBrowsers = [
        { name: "chromium" as const, options: { headless: false } },
      ];
      const mockTestCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      mockResolveEffectiveConfig.mockResolvedValue(mockConfig);
      mockLoadBrowserAdapter.mockResolvedValue(mockBrowserAdapter);
      mockLoadAllTestCaseAdapters.mockResolvedValue(mockTestCaseAdapters);
      mockParseBrowsersFromConfig.mockReturnValue(mockBrowsers);
      mockDiscoverCasesFromAllAdapters.mockResolvedValue(mockTestCases);
      mockGetAdapter.mockResolvedValue(mockBrowserAdapter);

      await listTestCases();

      // Verify getAdapter was called with browser options
      expect(mockGetAdapter).toHaveBeenCalledWith(
        "chromium",
        { headless: false },
        expect.any(Function)
      );
    });
  });

  describe("ListResult type", () => {
    it("should accept valid ListResult objects", () => {
      const validResult: ListResult = {
        testCases: [
          createMockTestCase({ caseId: "button", variantId: "default" }),
        ],
        summary: {
          total: 1,
          browsers: ["chromium"],
          viewports: ["1920x1080"],
        },
      };

      expect(validResult).toBeDefined();
    });

    it("should accept empty ListResult", () => {
      const emptyResult: ListResult = {
        testCases: [],
        summary: {
          total: 0,
          browsers: [],
          viewports: [],
        },
      };

      expect(emptyResult).toBeDefined();
    });
  });
});
