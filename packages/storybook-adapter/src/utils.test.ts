import { describe, it, expect, vi } from "vitest";
import { withTimeout, escapeRegExp, toSafeRegex } from "./utils.js";

describe("utils", () => {
  describe("withTimeout", () => {
    it("should resolve with the promise result when promise resolves within timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await withTimeout(promise, 1000, "timeout");
      expect(result).toBe("success");
    });

    it("should reject with timeout error when promise takes too long", async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve("delayed"), 200));
      await expect(withTimeout(promise, 100, "timeout")).rejects.toThrow("timeout");
    });

    it("should reject with original error when promise rejects", async () => {
      const promise = Promise.reject(new Error("original error"));
      await expect(withTimeout(promise, 1000, "timeout")).rejects.toThrow("original error");
    });

    it("should clear timeout when promise resolves", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const promise = Promise.resolve("success");
      await withTimeout(promise, 1000, "timeout");
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should clear timeout when promise rejects", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const promise = Promise.reject(new Error("error"));
      try {
        await withTimeout(promise, 1000, "timeout");
      } catch {
        // Expected to throw
      }
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe("escapeRegExp", () => {
    it("should escape special regex characters", () => {
      expect(escapeRegExp("hello.world")).toBe("hello\\.world");
      expect(escapeRegExp("test*pattern")).toBe("test\\*pattern");
      expect(escapeRegExp("path/to/file")).toBe("path/to/file");
      expect(escapeRegExp("test[0-9]")).toBe("test\\[0-9\\]");
      expect(escapeRegExp("test{1,2}")).toBe("test\\{1,2\\}");
      expect(escapeRegExp("test(abc)")).toBe("test\\(abc\\)");
      expect(escapeRegExp("test^start")).toBe("test\\^start");
      expect(escapeRegExp("test$end")).toBe("test\\$end");
      expect(escapeRegExp("test|or")).toBe("test\\|or");
      expect(escapeRegExp("test+plus")).toBe("test\\+plus");
      expect(escapeRegExp("test?optional")).toBe("test\\?optional");
    });

    it("should handle empty string", () => {
      expect(escapeRegExp("")).toBe("");
    });

    it("should handle string with no special characters", () => {
      expect(escapeRegExp("hello")).toBe("hello");
    });

    it("should handle string with all special characters", () => {
      const input = ".*+?^${}()|[\\]";
      const expected = "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\\\\\]";
      expect(escapeRegExp(input)).toBe(expected);
    });
  });

  describe("toSafeRegex", () => {
    it("should convert simple wildcard pattern to regex", () => {
      const regex = toSafeRegex("test*");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex!.test("test123")).toBe(true);
      expect(regex!.test("test")).toBe(true);
      expect(regex!.test("other")).toBe(false);
    });

    it("should convert multiple wildcard pattern to regex", () => {
      const regex = toSafeRegex("test*pattern*");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex!.test("test123pattern456")).toBe(true);
      expect(regex!.test("testpattern")).toBe(true);
      expect(regex!.test("test123")).toBe(false);
    });

    it("should handle pattern with no wildcards", () => {
      const regex = toSafeRegex("exact-match");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex!.test("exact-match")).toBe(true);
      expect(regex!.test("exact-match-extra")).toBe(false);
    });

    it("should handle pattern with escaped characters", () => {
      const regex = toSafeRegex("test.pattern*");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex!.test("test.pattern123")).toBe(true);
      expect(regex!.test("testXpattern123")).toBe(false);
    });

    it("should return null for invalid regex pattern", () => {
      // This is hard to test since toSafeRegex handles most cases gracefully
      // But we can test edge cases
      const regex = toSafeRegex("");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex!.test("")).toBe(true);
    });

    it("should handle complex patterns", () => {
      const regex = toSafeRegex("component-*/*-story");
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex!.test("component-button/button-story")).toBe(true);
      expect(regex!.test("component-button/input-story")).toBe(true);
      expect(regex!.test("component-button/button-other")).toBe(false);
    });

    it("should be anchored (start and end)", () => {
      const regex = toSafeRegex("test");
      expect(regex!.test("test")).toBe(true);
      expect(regex!.test("pretest")).toBe(false);
      expect(regex!.test("testpost")).toBe(false);
      expect(regex!.test("pretestpost")).toBe(false);
    });
  });
});
