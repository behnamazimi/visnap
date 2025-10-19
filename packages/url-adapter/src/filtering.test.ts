import { describe, it, expect } from "vitest";

import { createTestUrlConfigs } from "./__mocks__/url-test-helpers";
import { createUrlFilter } from "./filtering";

describe("createUrlFilter", () => {
  const testUrls = createTestUrlConfigs();

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

  describe("single string pattern edge cases", () => {
    it("should handle single string include pattern", () => {
      const filter = createUrlFilter({ include: "homepage" });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("homepage");
    });

    it("should handle single string exclude pattern", () => {
      const filter = createUrlFilter({ exclude: "admin-dashboard" });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(4);
      expect(filtered.map(u => u.id)).not.toContain("admin-dashboard");
    });

    it("should handle single string include pattern with wildcard", () => {
      const filter = createUrlFilter({ include: "*page*" });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(u => u.id)).toEqual([
        "homepage",
        "about-page",
        "pricing-page",
      ]);
    });

    it("should handle single string exclude pattern with wildcard", () => {
      const filter = createUrlFilter({ exclude: "*admin*" });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(4);
      expect(filtered.map(u => u.id)).not.toContain("admin-dashboard");
    });

    it("should handle both single string patterns", () => {
      const filter = createUrlFilter({
        include: "*page*",
        exclude: "*admin*",
      });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(u => u.id)).toEqual([
        "homepage",
        "about-page",
        "pricing-page",
      ]);
    });

    it("should handle empty string patterns", () => {
      const filter = createUrlFilter({
        include: "",
        exclude: "",
      });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(5); // Empty patterns should not filter anything
    });

    it("should handle undefined patterns", () => {
      const filter = createUrlFilter({
        include: undefined,
        exclude: undefined,
      });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(5);
    });

    it("should handle mixed array and string patterns", () => {
      const filter = createUrlFilter({
        include: ["homepage", "about*"],
        exclude: "admin-dashboard",
      });
      const filtered = testUrls.filter(filter);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(u => u.id)).toEqual(["homepage", "about-page"]);
    });
  });
});
