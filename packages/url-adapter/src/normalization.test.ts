import { describe, it, expect } from "vitest";

import { createTestUrlConfig } from "./__mocks__/url-test-helpers";
import type { UrlConfig } from "./filtering";
import {
  normalizeUrls,
  expandUrlsForViewports,
  generateTestId,
} from "./normalization";

describe("normalizeUrls", () => {
  const testUrls: UrlConfig[] = [
    createTestUrlConfig({ id: "homepage", url: "http://localhost:3000/" }),
    createTestUrlConfig({ id: "about", url: "http://localhost:3000/about" }),
  ];

  it("should normalize URLs with default viewport", () => {
    const result = normalizeUrls(testUrls, {
      viewportKeys: ["default"],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      id: "homepage",
      title: "homepage",
      kind: "url",
      caseId: "homepage",
      variantId: "default",
      url: "http://localhost:3000/",
    });
  });

  it("should expand URLs across multiple viewports", () => {
    const result = normalizeUrls(testUrls, {
      viewportKeys: ["desktop", "mobile"],
      globalViewport: {
        desktop: { width: 1920, height: 1080 },
        mobile: { width: 375, height: 667 },
      },
    });

    expect(result).toHaveLength(4);

    const homepageDesktop = result.find(
      r => r.id === "homepage" && r.variantId === "desktop"
    );
    const homepageMobile = result.find(
      r => r.id === "homepage" && r.variantId === "mobile"
    );

    expect(homepageDesktop?.viewport).toEqual({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
    expect(homepageMobile?.viewport).toEqual({
      width: 375,
      height: 667,
      deviceScaleFactor: 1,
    });
  });

  it("should use per-URL viewport overrides", () => {
    const urlsWithViewport: UrlConfig[] = [
      createTestUrlConfig({
        id: "homepage",
        url: "http://localhost:3000/",
        viewport: { width: 1200, height: 800 },
      }),
    ];

    const result = normalizeUrls(urlsWithViewport, {
      viewportKeys: ["desktop"],
      globalViewport: {
        desktop: { width: 1920, height: 1080 },
      },
    });

    expect(result[0].viewport).toEqual({
      width: 1200,
      height: 800,
      deviceScaleFactor: 1,
    });
  });

  it("should include per-URL configuration", () => {
    const urlsWithConfig: UrlConfig[] = [
      createTestUrlConfig({
        id: "homepage",
        url: "http://localhost:3000/",
        title: "Home Page",
        screenshotTarget: "body",
        threshold: 0.05,
        interactions: [{ type: "click", selector: "button" }],
      }),
    ];

    const result = normalizeUrls(urlsWithConfig, {
      viewportKeys: ["default"],
    });

    expect(result[0]).toMatchObject({
      title: "Home Page",
      screenshotTarget: "body",
      threshold: 0.05,
      interactions: [{ type: "click", selector: "button" }],
    });
  });

  it("should set visualTesting config", () => {
    const result = normalizeUrls(testUrls, {
      viewportKeys: ["default"],
    });

    expect(result[0].visualTesting).toMatchObject({
      skip: false,
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
      disableCSSInjection: false,
    });
  });

  it("should sort viewport keys deterministically", () => {
    const result = normalizeUrls(testUrls, {
      viewportKeys: ["mobile", "desktop", "tablet"],
    });

    const viewportIds = result.map(r => r.variantId);
    expect(viewportIds).toEqual([
      "mobile",
      "desktop",
      "tablet",
      "mobile",
      "desktop",
      "tablet",
    ]);
  });
});

describe("expandUrlsForViewports", () => {
  const testUrls: UrlConfig[] = [
    createTestUrlConfig({ id: "homepage", url: "http://localhost:3000/" }),
  ];

  it("should expand URLs for multiple viewports", () => {
    const viewportMap = {
      desktop: { width: 1920, height: 1080 },
      mobile: { width: 375, height: 667 },
    };

    const result = expandUrlsForViewports(testUrls, viewportMap);

    expect(result).toHaveLength(2);
    expect(result.map(r => r.variantId)).toEqual(["desktop", "mobile"]);
  });

  it("should use default viewport when none provided", () => {
    const result = expandUrlsForViewports(testUrls, {});

    expect(result).toHaveLength(1);
    expect(result[0].variantId).toBe("default");
    expect(result[0].viewport).toEqual({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
  });
});

describe("generateTestId", () => {
  it("should generate test ID from URL config and viewport key", () => {
    const urlConfig = createTestUrlConfig({ id: "homepage" });
    const viewportKey = "desktop";

    const result = generateTestId(urlConfig, viewportKey);
    expect(result).toBe("homepage-desktop");
  });

  it("should handle special characters in IDs", () => {
    const urlConfig = createTestUrlConfig({ id: "test-page-1" });
    const viewportKey = "mobile-view";

    const result = generateTestId(urlConfig, viewportKey);
    expect(result).toBe("test-page-1-mobile-view");
  });

  it("should handle empty viewport key", () => {
    const urlConfig = createTestUrlConfig({ id: "homepage" });
    const viewportKey = "";

    const result = generateTestId(urlConfig, viewportKey);
    expect(result).toBe("homepage-");
  });
});

describe("createSafeViewport error handling", () => {
  // Note: createSafeViewport error cases are not testable through normalizeUrls
  // because viewport validation happens at the schema level before reaching createSafeViewport

  it("should handle deviceScaleFactor properly", () => {
    const result = normalizeUrls(
      [
        createTestUrlConfig({
          viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
        }),
      ],
      {
        viewportKeys: ["default"],
      }
    );

    expect(result[0].viewport).toEqual({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });
  });

  it("should use fallback viewport when viewport is undefined", () => {
    const result = normalizeUrls(
      [createTestUrlConfig({ viewport: undefined })],
      {
        viewportKeys: ["default"],
      }
    );

    expect(result[0].viewport).toEqual({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });
  });
});
