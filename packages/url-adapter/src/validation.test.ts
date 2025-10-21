import type { InteractionAction } from "@visnap/protocol";
import { describe, it, expect } from "vitest";

import { createMockTestCaseInstance } from "./__mocks__/url-mock-factories";
import {
  createTestUrlConfig,
  createTestAdapterOptions,
  expectToThrowWithMessage,
} from "./__mocks__/url-test-helpers";
import {
  isValidUrl,
  validateUrlConfig,
  validateCreateUrlAdapterOptions,
  validateUniqueTestCaseIds,
} from "./validation";

describe("isValidUrl", () => {
  it("should validate HTTP URLs", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
    expect(isValidUrl("http://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/path")).toBe(true);
    expect(isValidUrl("http://example.com/path?query=1")).toBe(true);
    expect(isValidUrl("http://example.com/path#fragment")).toBe(true);
  });

  it("should validate HTTPS URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("https://example.com/path")).toBe(true);
    expect(isValidUrl("https://example.com/path?query=1")).toBe(true);
    expect(isValidUrl("https://example.com/path#fragment")).toBe(true);
  });

  it("should reject invalid URLs", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
    expect(isValidUrl("http://")).toBe(false);
    expect(isValidUrl("https://")).toBe(false);
    expect(isValidUrl("file:///path")).toBe(false);
    expect(isValidUrl("data:text/plain,hello")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });

  it("should handle edge cases", () => {
    expect(isValidUrl("http://localhost")).toBe(true);
    expect(isValidUrl("http://127.0.0.1")).toBe(true);
    expect(isValidUrl("http://[::1]")).toBe(true);
    expect(isValidUrl("http://example.com:8080")).toBe(true);
    expect(isValidUrl("https://subdomain.example.com")).toBe(true);
  });
});

describe("validateUrlConfig", () => {
  it("should validate correct URL config", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      title: "Test Page",
      screenshotTarget: "body",
      threshold: 0.1,
      viewport: { width: 1920, height: 1080 },
      interactions: [{ type: "click", selector: "button" }],
    });

    const result = validateUrlConfig(config);
    expect(result).toBeDefined();
    expect(result.id).toBe("test");
    expect(result.url).toBe("http://localhost:3000");
  });

  it("should require id field", () => {
    const config = { url: "http://localhost:3000" } as any;
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "Invalid URL config: id must be a string (was missing)"
    );
  });

  it("should require non-empty id field", () => {
    const config = { id: "", url: "http://localhost:3000" } as any;
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "Invalid URL config: id must be non-empty"
    );
  });

  it("should require url field", () => {
    const config = { id: "test" } as any;
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "Invalid URL config: url must be a string (was missing)"
    );
  });

  it("should require non-empty url field", () => {
    const config = { id: "test", url: "" } as any;
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "Invalid URL config: url must be non-empty"
    );
  });

  it("should validate URL format", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "not-a-url",
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "URL 'not-a-url' is not a valid HTTP/HTTPS URL"
    );
  });

  it("should validate viewport dimensions", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      viewport: { width: -100, height: 0 },
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "viewport.height must be positive (was 0)"
    );
  });

  it("should validate viewport width is positive", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      viewport: { width: 0, height: 1080 },
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "viewport.width must be positive (was 0)"
    );
  });

  it("should validate viewport height is positive", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      viewport: { width: 1920, height: -50 },
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "viewport.height must be positive (was -50)"
    );
  });

  it("should validate interactions array", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      interactions: "not-an-array" as unknown as InteractionAction[],
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "Invalid URL config: interactions must be an array (was string)"
    );
  });

  it("should validate elementsToMask array", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      elementsToMask: "not-an-array" as unknown as string[],
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "Invalid URL config: elementsToMask must be an array (was string)"
    );
  });

  it("should validate deviceScaleFactor is positive", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 0 },
    });
    expectToThrowWithMessage(
      () => validateUrlConfig(config),
      "viewport.deviceScaleFactor must be positive (was 0)"
    );
  });

  it("should accept valid optional fields", () => {
    const config = createTestUrlConfig({
      id: "test",
      url: "http://localhost:3000",
      title: "Test Page",
      screenshotTarget: "main",
      threshold: 0.05,
      disableCSSInjection: true,
      interactions: [{ type: "click", selector: "button" }],
      elementsToMask: [".header", ".footer"],
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
    });

    const result = validateUrlConfig(config);
    expect(result).toBeDefined();
    expect(result.title).toBe("Test Page");
    expect(result.screenshotTarget).toBe("main");
    expect(result.threshold).toBe(0.05);
    expect(result.disableCSSInjection).toBe(true);
    expect(result.interactions).toEqual([
      { type: "click", selector: "button" },
    ]);
    expect(result.elementsToMask).toEqual([".header", ".footer"]);
    expect(result.viewport?.deviceScaleFactor).toBe(2);
  });
});

describe("validateCreateUrlAdapterOptions", () => {
  it("should validate correct options", () => {
    const options = createTestAdapterOptions();
    const result = validateCreateUrlAdapterOptions(options);
    expect(result).toBeDefined();
    expect(result.urls).toHaveLength(5);
  });

  it("should require urls field", () => {
    expectToThrowWithMessage(
      () => validateCreateUrlAdapterOptions({} as any),
      "Invalid URL adapter options: urls must be an array (was missing)"
    );
  });

  it("should require urls to be an array", () => {
    expectToThrowWithMessage(
      () => validateCreateUrlAdapterOptions({ urls: "not-an-array" } as any),
      "Invalid URL adapter options: urls must be an array (was string)"
    );
  });

  it("should require at least one URL", () => {
    expectToThrowWithMessage(
      () => validateCreateUrlAdapterOptions({ urls: [] }),
      "At least one URL must be provided"
    );
  });

  it("should validate each URL config", () => {
    const options = {
      urls: [
        { id: "", url: "not-a-url" }, // Invalid
        { id: "valid", url: "http://localhost:3000" }, // Valid
      ],
    };
    expectToThrowWithMessage(
      () => validateCreateUrlAdapterOptions(options),
      "Invalid URL config: id must be non-empty"
    );
  });

  it("should accept include patterns", () => {
    const options = createTestAdapterOptions({
      include: "homepage",
    });
    const result = validateCreateUrlAdapterOptions(options);
    expect(result.include).toBe("homepage");
  });

  it("should accept include patterns as array", () => {
    const options = createTestAdapterOptions({
      include: ["homepage", "about*"],
    });
    const result = validateCreateUrlAdapterOptions(options);
    expect(result.include).toEqual(["homepage", "about*"]);
  });

  it("should accept exclude patterns", () => {
    const options = createTestAdapterOptions({
      exclude: "admin*",
    });
    const result = validateCreateUrlAdapterOptions(options);
    expect(result.exclude).toBe("admin*");
  });

  it("should accept exclude patterns as array", () => {
    const options = createTestAdapterOptions({
      exclude: ["admin*", "*test*"],
    });
    const result = validateCreateUrlAdapterOptions(options);
    expect(result.exclude).toEqual(["admin*", "*test*"]);
  });

  it("should accept both include and exclude patterns", () => {
    const options = createTestAdapterOptions({
      include: ["homepage", "about*"],
      exclude: ["admin*", "*test*"],
    });
    const result = validateCreateUrlAdapterOptions(options);
    expect(result.include).toEqual(["homepage", "about*"]);
    expect(result.exclude).toEqual(["admin*", "*test*"]);
  });
});

describe("validateUniqueTestCaseIds", () => {
  it("should pass with unique IDs", () => {
    const testCases = [
      createMockTestCaseInstance({ id: "homepage" }),
      createMockTestCaseInstance({ id: "about" }),
    ];
    expect(() => validateUniqueTestCaseIds(testCases)).not.toThrow();
  });

  it("should throw on duplicate IDs", () => {
    const testCases = [
      createMockTestCaseInstance({ id: "homepage" }),
      createMockTestCaseInstance({ id: "homepage" }),
    ];
    expectToThrowWithMessage(
      () => validateUniqueTestCaseIds(testCases),
      "Duplicate test case IDs found: homepage"
    );
  });

  it("should list all duplicates", () => {
    const testCases = [
      createMockTestCaseInstance({ id: "page1" }),
      createMockTestCaseInstance({ id: "page1" }),
      createMockTestCaseInstance({ id: "page2" }),
      createMockTestCaseInstance({ id: "page2" }),
    ];
    expectToThrowWithMessage(
      () => validateUniqueTestCaseIds(testCases),
      "Duplicate test case IDs found: page1, page2"
    );
  });

  it("should handle empty array", () => {
    expect(() => validateUniqueTestCaseIds([])).not.toThrow();
  });

  it("should handle single test case", () => {
    const testCases = [createMockTestCaseInstance({ id: "single" })];
    expect(() => validateUniqueTestCaseIds(testCases)).not.toThrow();
  });
});
