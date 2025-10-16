import { describe, it, expect } from "vitest";

import type { UrlConfig } from "./filtering";
import { normalizeUrls, expandUrlsForViewports } from "./normalization";

describe("normalizeUrls", () => {
  const testUrls: UrlConfig[] = [
    { id: "homepage", url: "http://localhost:3000/" },
    { id: "about", url: "http://localhost:3000/about" },
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

    expect(homepageDesktop?.viewport).toEqual({ width: 1920, height: 1080 });
    expect(homepageMobile?.viewport).toEqual({ width: 375, height: 667 });
  });

  it("should use per-URL viewport overrides", () => {
    const urlsWithViewport: UrlConfig[] = [
      {
        id: "homepage",
        url: "http://localhost:3000/",
        viewport: { width: 1200, height: 800 },
      },
    ];

    const result = normalizeUrls(urlsWithViewport, {
      viewportKeys: ["desktop"],
      globalViewport: {
        desktop: { width: 1920, height: 1080 },
      },
    });

    expect(result[0].viewport).toEqual({ width: 1200, height: 800 });
  });

  it("should include per-URL configuration", () => {
    const urlsWithConfig: UrlConfig[] = [
      {
        id: "homepage",
        url: "http://localhost:3000/",
        title: "Home Page",
        screenshotTarget: "body",
        threshold: 0.05,
        interactions: [{ type: "click", selector: "button" }],
      },
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
      screenshotTarget: undefined,
      threshold: undefined,
      viewport: { width: 1920, height: 1080 },
      disableCSSInjection: false,
      interactions: undefined,
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
    { id: "homepage", url: "http://localhost:3000/" },
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
    expect(result[0].viewport).toEqual({ width: 1920, height: 1080 });
  });
});
