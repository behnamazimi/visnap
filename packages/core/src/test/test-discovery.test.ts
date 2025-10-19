import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  startAdapterAndResolvePageUrl,
  sortCasesStable,
  discoverCases,
  expandCasesForBrowsers,
  discoverTestCasesWithBrowsers,
  discoverCasesFromAllAdapters,
} from "./test-discovery";

import {
  createMockTestCaseAdapter,
  createMockBrowserAdapter,
  createMockPage,
} from "@/__mocks__/mock-adapters";
import {
  createMockTestCase,
  createMockViewport,
} from "@/__mocks__/mock-factories";

describe("test-discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startAdapterAndResolvePageUrl", () => {
    it("should resolve page URL from initialPageUrl", async () => {
      const mockAdapter = createMockTestCaseAdapter({
        start: vi.fn().mockResolvedValue({
          initialPageUrl: "http://localhost:6006/iframe.html",
        }),
      });

      const result = await startAdapterAndResolvePageUrl(mockAdapter);

      expect(result).toBe("http://localhost:6006/iframe.html");
      expect(mockAdapter.start).toHaveBeenCalledTimes(1);
    });

    it("should resolve page URL from baseUrl", async () => {
      const mockAdapter = createMockTestCaseAdapter({
        start: vi.fn().mockResolvedValue({
          baseUrl: "http://localhost:6006",
        }),
      });

      const result = await startAdapterAndResolvePageUrl(mockAdapter);

      expect(result).toBe("http://localhost:6006");
      expect(mockAdapter.start).toHaveBeenCalledTimes(1);
    });

    it("should prefer initialPageUrl over baseUrl", async () => {
      const mockAdapter = createMockTestCaseAdapter({
        start: vi.fn().mockResolvedValue({
          baseUrl: "http://localhost:6006",
          initialPageUrl: "http://localhost:6006/iframe.html",
        }),
      });

      const result = await startAdapterAndResolvePageUrl(mockAdapter);

      expect(result).toBe("http://localhost:6006/iframe.html");
    });

    it("should throw error when no URL is provided", async () => {
      const mockAdapter = createMockTestCaseAdapter({
        start: vi.fn().mockResolvedValue({}),
      });

      await expect(startAdapterAndResolvePageUrl(mockAdapter)).rejects.toThrow(
        "Test case adapter must provide either baseUrl or initialPageUrl"
      );
    });

    it("should throw error when adapter returns null", async () => {
      const mockAdapter = createMockTestCaseAdapter({
        start: vi.fn().mockResolvedValue(null),
      });

      await expect(startAdapterAndResolvePageUrl(mockAdapter)).rejects.toThrow(
        "Test case adapter must provide either baseUrl or initialPageUrl"
      );
    });

    it("should handle adapter without start method", async () => {
      const mockAdapter = createMockTestCaseAdapter({
        start: undefined,
      });

      await expect(startAdapterAndResolvePageUrl(mockAdapter)).rejects.toThrow(
        "Test case adapter must provide either baseUrl or initialPageUrl"
      );
    });
  });

  describe("sortCasesStable", () => {
    it("should sort cases by caseId then variantId", () => {
      const cases = [
        createMockTestCase({ caseId: "button", variantId: "hover" }),
        createMockTestCase({ caseId: "input", variantId: "default" }),
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({ caseId: "input", variantId: "focus" }),
      ];

      sortCasesStable(cases);

      expect(cases[0].caseId).toBe("button");
      expect(cases[0].variantId).toBe("default");
      expect(cases[1].caseId).toBe("button");
      expect(cases[1].variantId).toBe("hover");
      expect(cases[2].caseId).toBe("input");
      expect(cases[2].variantId).toBe("default");
      expect(cases[3].caseId).toBe("input");
      expect(cases[3].variantId).toBe("focus");
    });

    it("should handle empty array", () => {
      const cases: any[] = [];
      sortCasesStable(cases);
      expect(cases).toEqual([]);
    });

    it("should handle single case", () => {
      const cases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];
      sortCasesStable(cases);
      expect(cases[0].caseId).toBe("button");
      expect(cases[0].variantId).toBe("default");
    });

    it("should handle cases with same caseId", () => {
      const cases = [
        createMockTestCase({ caseId: "button", variantId: "hover" }),
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({ caseId: "button", variantId: "focus" }),
      ];

      sortCasesStable(cases);

      expect(cases[0].caseId).toBe("button");
      expect(cases[0].variantId).toBe("default");
      expect(cases[1].caseId).toBe("button");
      expect(cases[1].variantId).toBe("focus");
      expect(cases[2].caseId).toBe("button");
      expect(cases[2].variantId).toBe("hover");
    });
  });

  describe("discoverCases", () => {
    it("should discover cases from adapter", async () => {
      const mockAdapter = createMockTestCaseAdapter();
      const mockPage = createMockPage();
      const mockCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({ caseId: "input", variantId: "default" }),
      ];

      (mockAdapter.listCases as any).mockResolvedValue(mockCases);

      const result = await discoverCases(
        mockAdapter,
        mockPage,
        createMockViewport() as any
      );

      expect(result).toEqual(mockCases);
      expect(mockAdapter.listCases).toHaveBeenCalledWith(mockPage, {
        viewport: createMockViewport() as any,
      });
    });

    it("should handle empty cases", async () => {
      const mockAdapter = createMockTestCaseAdapter();
      const mockPage = createMockPage();

      (mockAdapter.listCases as any).mockResolvedValue([]);

      const result = await discoverCases(mockAdapter, mockPage, undefined);

      expect(result).toEqual([]);
      expect(mockAdapter.listCases).toHaveBeenCalledWith(mockPage, {
        viewport: undefined,
      });
    });

    it("should handle adapter errors", async () => {
      const mockAdapter = createMockTestCaseAdapter();
      const mockPage = createMockPage();
      const error = new Error("Discovery failed");

      (mockAdapter.listCases as any).mockRejectedValue(error);

      await expect(
        discoverCases(mockAdapter, mockPage, undefined)
      ).rejects.toThrow("Discovery failed");
    });
  });

  describe("expandCasesForBrowsers", () => {
    it("should expand cases for multiple browsers", () => {
      const discoveredCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
        createMockTestCase({ caseId: "input", variantId: "default" }),
      ];
      const browsers = [
        { name: "chromium" as const },
        { name: "firefox" as const },
      ];

      const result = expandCasesForBrowsers(discoveredCases, browsers);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        ...discoveredCases[0],
        variantId: "default-chromium",
        browser: "chromium",
      });
      expect(result[1]).toEqual({
        ...discoveredCases[0],
        variantId: "default-firefox",
        browser: "firefox",
      });
      expect(result[2]).toEqual({
        ...discoveredCases[1],
        variantId: "default-chromium",
        browser: "chromium",
      });
      expect(result[3]).toEqual({
        ...discoveredCases[1],
        variantId: "default-firefox",
        browser: "firefox",
      });
    });

    it("should expand cases for single browser", () => {
      const discoveredCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];
      const browsers = [{ name: "chromium" as const }];

      const result = expandCasesForBrowsers(discoveredCases, browsers);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...discoveredCases[0],
        variantId: "default-chromium",
        browser: "chromium",
      });
    });

    it("should handle empty cases", () => {
      const discoveredCases: any[] = [];
      const browsers = [{ name: "chromium" as const }];

      const result = expandCasesForBrowsers(discoveredCases, browsers);

      expect(result).toEqual([]);
    });

    it("should handle browsers with options", () => {
      const discoveredCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];
      const browsers = [
        { name: "chromium" as const, options: { headless: true } },
        { name: "firefox" as const, options: { devtools: true } },
      ];

      const result = expandCasesForBrowsers(discoveredCases, browsers);

      expect(result).toHaveLength(2);
      expect(result[0].browser).toBe("chromium");
      expect(result[1].browser).toBe("firefox");
    });
  });

  describe("discoverTestCasesWithBrowsers", () => {
    it("should discover and expand cases for browsers", async () => {
      const mockAdapter = createMockTestCaseAdapter();
      const mockPage = createMockPage();
      const browsers = [
        { name: "chromium" as const },
        { name: "firefox" as const },
      ];
      const discoveredCases = [
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      (mockAdapter.listCases as any).mockResolvedValue(discoveredCases);

      const result = await discoverTestCasesWithBrowsers(
        mockAdapter,
        mockPage,
        undefined,
        browsers
      );

      expect(result).toHaveLength(2);
      expect(result[0].caseId).toBe("button");
      expect(result[0].variantId).toBe("default-chromium");
      expect(result[0].browser).toBe("chromium");
      expect(result[1].caseId).toBe("button");
      expect(result[1].variantId).toBe("default-firefox");
      expect(result[1].browser).toBe("firefox");
    });

    it("should sort cases after expansion", async () => {
      const mockAdapter = createMockTestCaseAdapter();
      const mockPage = createMockPage();
      const browsers = [
        { name: "chromium" as const },
        { name: "firefox" as const },
      ];
      const discoveredCases = [
        createMockTestCase({ caseId: "input", variantId: "default" }),
        createMockTestCase({ caseId: "button", variantId: "default" }),
      ];

      (mockAdapter.listCases as any).mockResolvedValue(discoveredCases);

      const result = await discoverTestCasesWithBrowsers(
        mockAdapter,
        mockPage,
        undefined,
        browsers
      );

      expect(result).toHaveLength(4);
      expect(result[0].caseId).toBe("button");
      expect(result[1].caseId).toBe("button");
      expect(result[2].caseId).toBe("input");
      expect(result[3].caseId).toBe("input");
    });

    it("should handle empty discovered cases", async () => {
      const mockAdapter = createMockTestCaseAdapter();
      const mockPage = createMockPage();
      const browsers = [{ name: "chromium" as const }];

      (mockAdapter.listCases as any).mockResolvedValue([]);

      const result = await discoverTestCasesWithBrowsers(
        mockAdapter,
        mockPage,
        undefined,
        browsers
      );

      expect(result).toEqual([]);
    });
  });

  describe("discoverCasesFromAllAdapters", () => {
    it("should discover cases from multiple adapters", async () => {
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockPage = createMockPage();
      const mockAdapters = [
        createMockTestCaseAdapter({
          name: "storybook",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:6006",
          }),
          listCases: vi
            .fn()
            .mockResolvedValue([
              createMockTestCase({ caseId: "button", variantId: "default" }),
            ]),
        }),
        createMockTestCaseAdapter({
          name: "playwright",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:3000",
          }),
          listCases: vi
            .fn()
            .mockResolvedValue([
              createMockTestCase({ caseId: "input", variantId: "default" }),
            ]),
        }),
      ];
      const browsers = [{ name: "chromium" as const }];

      mockBrowserAdapter.openPage = vi.fn().mockResolvedValue(mockPage);

      const result = await discoverCasesFromAllAdapters(
        mockAdapters,
        mockBrowserAdapter,
        undefined,
        browsers
      );

      expect(result).toHaveLength(2);
      expect(result[0].caseId).toBe("playwright-input");
      expect(result[0].id).toBe("playwright-input");
      expect(result[1].caseId).toBe("storybook-button");
      expect(result[1].id).toBe("storybook-button");
    });

    it("should handle adapter errors gracefully", async () => {
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockPage = createMockPage();
      const mockAdapters = [
        createMockTestCaseAdapter({
          name: "storybook",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:6006",
          }),
          listCases: vi
            .fn()
            .mockResolvedValue([
              createMockTestCase({ caseId: "button", variantId: "default" }),
            ]),
        }),
        createMockTestCaseAdapter({
          name: "failing",
          start: vi.fn().mockRejectedValue(new Error("Adapter failed")),
        }),
      ];
      const browsers = [{ name: "chromium" as const }];

      mockBrowserAdapter.openPage = vi.fn().mockResolvedValue(mockPage);

      const result = await discoverCasesFromAllAdapters(
        mockAdapters,
        mockBrowserAdapter,
        undefined,
        browsers
      );

      expect(result).toHaveLength(1);
      expect(result[0].caseId).toBe("storybook-button");
    });

    it("should handle browser adapter without openPage method", async () => {
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockAdapters = [
        createMockTestCaseAdapter({
          name: "storybook",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:6006",
          }),
        }),
      ];
      const browsers = [{ name: "chromium" as const }];

      // Mock the openPage method to be undefined
      Object.defineProperty(mockBrowserAdapter, "openPage", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // The function should handle the error gracefully and return empty array
      const result = await discoverCasesFromAllAdapters(
        mockAdapters,
        mockBrowserAdapter,
        undefined,
        browsers
      );

      expect(result).toEqual([]);
    });

    it("should close pages after discovery", async () => {
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockPage = createMockPage();
      const mockAdapters = [
        createMockTestCaseAdapter({
          name: "storybook",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:6006",
          }),
          listCases: vi.fn().mockResolvedValue([]),
        }),
      ];
      const browsers = [{ name: "chromium" as const }];

      mockBrowserAdapter.openPage = vi.fn().mockResolvedValue(mockPage);

      await discoverCasesFromAllAdapters(
        mockAdapters,
        mockBrowserAdapter,
        undefined,
        browsers
      );

      expect(mockPage.close).toHaveBeenCalledTimes(1);
    });

    it("should sort all cases after discovery", async () => {
      const mockBrowserAdapter = createMockBrowserAdapter();
      const mockPage = createMockPage();
      const mockAdapters = [
        createMockTestCaseAdapter({
          name: "storybook",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:6006",
          }),
          listCases: vi
            .fn()
            .mockResolvedValue([
              createMockTestCase({ caseId: "input", variantId: "default" }),
            ]),
        }),
        createMockTestCaseAdapter({
          name: "playwright",
          start: vi.fn().mockResolvedValue({
            baseUrl: "http://localhost:3000",
          }),
          listCases: vi
            .fn()
            .mockResolvedValue([
              createMockTestCase({ caseId: "button", variantId: "default" }),
            ]),
        }),
      ];
      const browsers = [{ name: "chromium" as const }];

      mockBrowserAdapter.openPage = vi.fn().mockResolvedValue(mockPage);

      const result = await discoverCasesFromAllAdapters(
        mockAdapters,
        mockBrowserAdapter,
        undefined,
        browsers
      );

      expect(result).toHaveLength(2);
      expect(result[0].caseId).toBe("playwright-button");
      expect(result[1].caseId).toBe("storybook-input");
    });
  });
});
