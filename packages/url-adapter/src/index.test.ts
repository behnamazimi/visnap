import { describe, it, expect, vi } from "vitest";

import {
  createTestAdapterOptions,
  createTestUrlConfig,
} from "./__mocks__/url-test-helpers";
import type { CreateUrlAdapterOptions } from "./filtering";

import { createAdapter } from "./index";

describe("createAdapter", () => {
  const validOptions = createTestAdapterOptions({
    urls: [
      createTestUrlConfig({ id: "homepage", url: "http://localhost:3000/" }),
      createTestUrlConfig({ id: "about", url: "http://localhost:3000/about" }),
    ],
  });

  it("should create adapter with valid options", () => {
    const adapter = createAdapter(validOptions);

    expect(adapter).toMatchObject({
      name: "url-adapter",
    });
    expect(typeof adapter.start).toBe("function");
    expect(typeof adapter.listCases).toBe("function");
    expect(typeof adapter.stop).toBe("function");
  });

  it("should throw error for invalid options", () => {
    expect(() =>
      createAdapter({} as unknown as CreateUrlAdapterOptions)
    ).toThrow(
      "Invalid URL adapter options: urls must be an array (was missing)"
    );
    expect(() => createAdapter({ urls: [] })).toThrow(
      "At least one URL must be provided"
    );
  });

  it("should throw error for invalid URL configs", () => {
    const invalidOptions = createTestAdapterOptions({
      urls: [createTestUrlConfig({ id: "", url: "not-a-url" })],
    });

    expect(() => createAdapter(invalidOptions)).toThrow(
      "Invalid URL config: id must be non-empty"
    );
  });

  it("should start adapter successfully", async () => {
    const adapter = createAdapter(validOptions);
    const result = await adapter.start?.();

    expect(result).toEqual({
      initialPageUrl: "http://localhost:3000/",
    });
  });

  it("should list cases without page context", async () => {
    const adapter = createAdapter(validOptions);
    const cases = await adapter.listCases();

    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({
      id: "homepage-default",
      title: "homepage",
      kind: "url",
      caseId: "homepage",
      variantId: "default",
      url: "http://localhost:3000/",
    });
  });

  it("should list cases with viewport configuration", async () => {
    const adapter = createAdapter(validOptions);
    const cases = await adapter.listCases(undefined, {
      viewport: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 375, height: 667 },
      },
    });

    expect(cases).toHaveLength(4); // 2 URLs × 2 viewports
    expect(cases.map(c => c.variantId)).toEqual([
      "desktop",
      "mobile",
      "desktop",
      "mobile",
    ]);
  });

  it("should apply include filtering", async () => {
    const adapter = createAdapter({
      urls: validOptions.urls,
      include: ["homepage"],
    });

    const cases = await adapter.listCases();
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe("homepage-default");
  });

  it("should apply exclude filtering", async () => {
    const adapter = createAdapter({
      urls: validOptions.urls,
      exclude: ["about"],
    });

    const cases = await adapter.listCases();
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe("homepage-default");
  });

  it("should handle per-URL configuration", async () => {
    const adapter = createAdapter(
      createTestAdapterOptions({
        urls: [
          createTestUrlConfig({
            id: "homepage",
            url: "http://localhost:3000/",
            title: "Home Page",
            screenshotTarget: "body",
            threshold: 0.05,
            interactions: [{ type: "click", selector: "button" }],
            elementsToMask: [".sticky", "#ads"],
          }),
        ],
      })
    );

    const cases = await adapter.listCases();
    expect(cases[0]).toMatchObject({
      title: "Home Page",
      screenshotTarget: "body",
      threshold: 0.05,
      interactions: [{ type: "click", selector: "button" }],
      elementsToMask: [".sticky", "#ads"],
    });
  });

  it("should stop adapter successfully", async () => {
    const adapter = createAdapter(validOptions);
    await expect(adapter.stop?.()).resolves.toBeUndefined();
  });

  it("should warn when no URLs match patterns", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const adapter = createAdapter(
      createTestAdapterOptions({
        urls: validOptions.urls,
        include: ["nonexistent"],
      })
    );

    await adapter.listCases();
    expect(consoleSpy).toHaveBeenCalledWith(
      "No URLs match the include/exclude patterns"
    );

    consoleSpy.mockRestore();
  });

  it("should throw error for duplicate URL IDs", async () => {
    const duplicateOptions = createTestAdapterOptions({
      urls: [
        createTestUrlConfig({ id: "duplicate", url: "http://localhost:3000/" }),
        createTestUrlConfig({
          id: "duplicate",
          url: "http://localhost:3000/about",
        }),
      ],
    });

    const adapter = createAdapter(duplicateOptions);
    await expect(adapter.listCases()).rejects.toThrow(
      "Duplicate test case IDs found: duplicate"
    );
  });

  describe("viewport edge cases", () => {
    it("should handle empty viewport array", async () => {
      const adapter = createAdapter(validOptions);
      const cases = await adapter.listCases(undefined, {
        viewport: {},
      });

      expect(cases).toHaveLength(2);
      expect(cases[0].variantId).toBe("default");
      expect(cases[0].viewport).toEqual({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
    });

    it("should handle undefined viewport option", async () => {
      const adapter = createAdapter(validOptions);
      const cases = await adapter.listCases(undefined, undefined);

      expect(cases).toHaveLength(2);
      expect(cases[0].variantId).toBe("default");
      expect(cases[0].viewport).toEqual({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
    });

    it("should sort viewport keys deterministically", async () => {
      const adapter = createAdapter(validOptions);
      const cases = await adapter.listCases(undefined, {
        viewport: {
          "z-viewport": { width: 800, height: 600 },
          "a-viewport": { width: 1200, height: 800 },
          "m-viewport": { width: 1000, height: 700 },
        },
      });

      expect(cases).toHaveLength(6); // 2 URLs × 3 viewports
      const viewportIds = cases.map(c => c.variantId);
      expect(viewportIds).toEqual([
        "a-viewport",
        "m-viewport",
        "z-viewport",
        "a-viewport",
        "m-viewport",
        "z-viewport",
      ]);
    });

    it("should handle special characters in viewport keys", async () => {
      const adapter = createAdapter(validOptions);
      const cases = await adapter.listCases(undefined, {
        viewport: {
          "desktop-1920x1080": { width: 1920, height: 1080 },
          "mobile-375x667": { width: 375, height: 667 },
          "tablet-768x1024": { width: 768, height: 1024 },
        },
      });

      expect(cases).toHaveLength(6);
      const viewportIds = cases.map(c => c.variantId);
      expect(viewportIds).toEqual([
        "desktop-1920x1080",
        "mobile-375x667",
        "tablet-768x1024",
        "desktop-1920x1080",
        "mobile-375x667",
        "tablet-768x1024",
      ]);
    });
  });
});
