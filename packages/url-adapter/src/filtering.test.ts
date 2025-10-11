import type { InteractionAction } from "@vividiff/protocol";
import { describe, it, expect } from "vitest";

import { createUrlFilter, isValidUrl, validateUrlConfig } from "./filtering.js";
import type { UrlConfig } from "./types.js";

describe("createUrlFilter", () => {
  const testUrls: UrlConfig[] = [
    { id: "homepage", url: "http://localhost:3000/" },
    { id: "about-page", url: "http://localhost:3000/about" },
    { id: "pricing-page", url: "http://localhost:3000/pricing" },
    { id: "admin-dashboard", url: "http://localhost:3000/admin" },
    { id: "contact-form", url: "http://localhost:3000/contact" },
  ];

  it("should include all URLs when no patterns provided", () => {
    const filter = createUrlFilter({});
    const filtered = testUrls.filter(filter);
    expect(filtered).toHaveLength(5);
  });

  it("should filter by include patterns", () => {
    const filter = createUrlFilter({ include: ["*page*"] });
    const filtered = testUrls.filter(filter);
    expect(filtered).toHaveLength(3);
    expect(filtered.map(u => u.id)).toEqual([
      "homepage",
      "about-page",
      "pricing-page",
    ]);
  });

  it("should filter by exclude patterns", () => {
    const filter = createUrlFilter({ exclude: ["*admin*"] });
    const filtered = testUrls.filter(filter);
    expect(filtered).toHaveLength(4);
    expect(filtered.map(u => u.id)).not.toContain("admin-dashboard");
  });

  it("should filter by both include and exclude patterns", () => {
    const filter = createUrlFilter({
      include: ["*page*"],
      exclude: ["*admin*"],
    });
    const filtered = testUrls.filter(filter);
    expect(filtered).toHaveLength(3);
    expect(filtered.map(u => u.id)).toEqual([
      "homepage",
      "about-page",
      "pricing-page",
    ]);
  });

  it("should handle multiple include patterns", () => {
    const filter = createUrlFilter({
      include: ["homepage", "contact-*"],
    });
    const filtered = testUrls.filter(filter);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(u => u.id)).toEqual(["homepage", "contact-form"]);
  });

  it("should handle multiple exclude patterns", () => {
    const filter = createUrlFilter({
      exclude: ["*admin*", "*form*"],
    });
    const filtered = testUrls.filter(filter);
    expect(filtered).toHaveLength(3);
    expect(filtered.map(u => u.id)).not.toContain("admin-dashboard");
    expect(filtered.map(u => u.id)).not.toContain("contact-form");
  });
});

describe("isValidUrl", () => {
  it("should validate HTTP URLs", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/path")).toBe(true);
  });

  it("should validate HTTPS URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path")).toBe(true);
  });

  it("should reject invalid URLs", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("http://")).toBe(false);
  });
});

describe("validateUrlConfig", () => {
  it("should validate correct URL config", () => {
    const config: UrlConfig = {
      id: "test",
      url: "http://localhost:3000",
      title: "Test Page",
      screenshotTarget: "body",
      threshold: 0.1,
      viewport: { width: 1920, height: 1080 },
      interactions: [{ type: "click", selector: "button" }],
    };

    const errors = validateUrlConfig(config);
    expect(errors).toHaveLength(0);
  });

  it("should require id field", () => {
    const config = { url: "http://localhost:3000" } as UrlConfig;
    const errors = validateUrlConfig(config);
    expect(errors).toContain("URL config must have a valid 'id' field");
  });

  it("should require url field", () => {
    const config = { id: "test" } as UrlConfig;
    const errors = validateUrlConfig(config);
    expect(errors).toContain("URL config must have a valid 'url' field");
  });

  it("should validate URL format", () => {
    const config: UrlConfig = {
      id: "test",
      url: "not-a-url",
    };
    const errors = validateUrlConfig(config);
    expect(errors).toContain("URL 'not-a-url' is not a valid HTTP/HTTPS URL");
  });

  it("should validate threshold range", () => {
    const config: UrlConfig = {
      id: "test",
      url: "http://localhost:3000",
      threshold: 1.5,
    };
    const errors = validateUrlConfig(config);
    expect(errors).toContain(
      "URL config 'threshold' must be a number between 0 and 1"
    );
  });

  it("should validate viewport dimensions", () => {
    const config: UrlConfig = {
      id: "test",
      url: "http://localhost:3000",
      viewport: { width: -100, height: 0 },
    };
    const errors = validateUrlConfig(config);
    expect(errors).toContain(
      "URL config 'viewport' must have valid width and height numbers"
    );
  });

  it("should validate interactions array", () => {
    const config: UrlConfig = {
      id: "test",
      url: "http://localhost:3000",
      interactions: "not-an-array" as unknown as InteractionAction[],
    };
    const errors = validateUrlConfig(config);
    expect(errors).toContain("URL config 'interactions' must be an array");
  });
});
