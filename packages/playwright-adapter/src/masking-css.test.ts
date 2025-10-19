import { describe, it, expect } from "vitest";

import { buildElementsMaskCSS } from "./masking-css";

describe("buildElementsMaskCSS", () => {
  it("should return empty string for undefined selectors", () => {
    expect(buildElementsMaskCSS(undefined)).toBe("");
  });

  it("should return empty string for null selectors", () => {
    expect(buildElementsMaskCSS(null as any)).toBe("");
  });

  it("should return empty string for empty array", () => {
    expect(buildElementsMaskCSS([])).toBe("");
  });

  it("should return empty string for array with empty strings", () => {
    expect(buildElementsMaskCSS(["", "   ", "\t\n"])).toBe("");
  });

  it("should return empty string for array with only whitespace", () => {
    expect(buildElementsMaskCSS(["   ", "\t", "\n"])).toBe("");
  });

  it("should handle single selector", () => {
    const result = buildElementsMaskCSS([".sticky"]);
    expect(result).toContain(".sticky{position:relative !important;}");
    expect(result).toContain(
      ".sticky::after{content:'';position:absolute;inset:0;"
    );
    expect(result).toContain(
      "background:#ffA500 !important;opacity:1;pointer-events:none;}"
    );
  });

  it("should handle multiple selectors", () => {
    const result = buildElementsMaskCSS([".sticky", "#ad", ".banner"]);
    expect(result).toContain(".sticky{position:relative !important;}");
    expect(result).toContain("#ad{position:relative !important;}");
    expect(result).toContain(".banner{position:relative !important;}");
    expect(result).toContain(
      ".sticky::after{content:'';position:absolute;inset:0;"
    );
    expect(result).toContain(
      "#ad::after{content:'';position:absolute;inset:0;"
    );
    expect(result).toContain(
      ".banner::after{content:'';position:absolute;inset:0;"
    );
  });

  it("should use default overlay color", () => {
    const result = buildElementsMaskCSS([".test"]);
    expect(result).toContain("background:#ffA500 !important;");
  });

  it("should use custom overlay color", () => {
    const result = buildElementsMaskCSS([".test"], "#ff0000");
    expect(result).toContain("background:#ff0000 !important;");
  });

  it("should trim whitespace from selectors", () => {
    const result = buildElementsMaskCSS(["  .sticky  ", "  #ad  "]);
    expect(result).toContain(".sticky{position:relative !important;}");
    expect(result).toContain("#ad{position:relative !important;}");
  });

  it("should filter out empty strings after trimming", () => {
    const result = buildElementsMaskCSS([".sticky", "", "   ", "#ad"]);
    expect(result).toContain(".sticky{position:relative !important;}");
    expect(result).toContain("#ad{position:relative !important;}");
    // The result should only contain the two valid selectors, not empty ones
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
  });

  it("should handle complex selectors", () => {
    const result = buildElementsMaskCSS([
      "[data-testid='ad-banner']",
      ".container > .advertisement",
      "#header .sticky-nav",
    ]);
    expect(result).toContain(
      "[data-testid='ad-banner']{position:relative !important;}"
    );
    expect(result).toContain(
      ".container > .advertisement{position:relative !important;}"
    );
    expect(result).toContain(
      "#header .sticky-nav{position:relative !important;}"
    );
  });

  it("should handle selectors with special characters", () => {
    const result = buildElementsMaskCSS([
      ".class-name",
      "#id-name",
      "[data-attr='value']",
      ".class\\:with\\:colons",
    ]);
    expect(result).toContain(".class-name{position:relative !important;}");
    expect(result).toContain("#id-name{position:relative !important;}");
    expect(result).toContain(
      "[data-attr='value']{position:relative !important;}"
    );
    expect(result).toContain(
      ".class\\:with\\:colons{position:relative !important;}"
    );
  });

  it("should generate complete CSS for each selector", () => {
    const result = buildElementsMaskCSS([".test"]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(1);
    expect(result).toMatch(
      /\.test\{position:relative !important;\}\.test::after\{content:'';position:absolute;inset:0;background:#ffA500 !important;opacity:1;pointer-events:none;\}/
    );
  });

  it("should join multiple selectors with newlines", () => {
    const result = buildElementsMaskCSS([".test1", ".test2"]);
    const lines = result.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain(".test1{position:relative !important;}");
    expect(lines[1]).toContain(".test2{position:relative !important;}");
  });

  it("should handle non-string values in array", () => {
    const result = buildElementsMaskCSS([
      ".test",
      123 as any,
      null as any,
      ".another",
    ]);
    expect(result).toContain(".test{position:relative !important;}");
    expect(result).toContain(".another{position:relative !important;}");
    expect(result).not.toContain("123");
  });

  it("should handle very long selector names", () => {
    const longSelector =
      ".very-long-class-name-that-might-cause-issues-with-css-generation-and-should-be-handled-properly";
    const result = buildElementsMaskCSS([longSelector]);
    expect(result).toContain(`${longSelector}{position:relative !important;}`);
    expect(result).toContain(
      `${longSelector}::after{content:'';position:absolute;inset:0;`
    );
  });

  it("should handle selectors with CSS pseudo-elements", () => {
    const result = buildElementsMaskCSS([".test::before", ".test::after"]);
    expect(result).toContain(".test::before{position:relative !important;}");
    expect(result).toContain(".test::after{position:relative !important;}");
  });

  it("should handle selectors with CSS pseudo-classes", () => {
    const result = buildElementsMaskCSS([
      ".test:hover",
      ".test:focus",
      ".test:active",
    ]);
    expect(result).toContain(".test:hover{position:relative !important;}");
    expect(result).toContain(".test:focus{position:relative !important;}");
    expect(result).toContain(".test:active{position:relative !important;}");
  });
});
