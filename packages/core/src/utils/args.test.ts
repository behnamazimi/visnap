import { describe, it, expect } from "vitest";

import { parseIncludeExclude, type ParsedArgs } from "./args";

describe("args", () => {
  describe("parseIncludeExclude", () => {
    it("should parse empty arguments", () => {
      const result = parseIncludeExclude([]);
      expect(result).toEqual({});
    });

    it("should parse single include argument", () => {
      const result = parseIncludeExclude(["--include", "button*"]);
      expect(result).toEqual({ include: ["button*"] });
    });

    it("should parse single exclude argument", () => {
      const result = parseIncludeExclude(["--exclude", "page*"]);
      expect(result).toEqual({ exclude: ["page*"] });
    });

    it("should parse both include and exclude arguments", () => {
      const result = parseIncludeExclude([
        "--include",
        "button*",
        "--exclude",
        "page*",
      ]);
      expect(result).toEqual({ include: ["button*"], exclude: ["page*"] });
    });

    it("should parse comma-separated values", () => {
      const result = parseIncludeExclude(["--include", "button*,form*,input*"]);
      expect(result).toEqual({ include: ["button*", "form*", "input*"] });
    });

    it("should parse multiple include arguments", () => {
      const result = parseIncludeExclude([
        "--include",
        "button*",
        "--include",
        "form*",
      ]);
      expect(result).toEqual({ include: ["button*", "form*"] });
    });

    it("should parse multiple exclude arguments", () => {
      const result = parseIncludeExclude([
        "--exclude",
        "page*",
        "--exclude",
        "layout*",
      ]);
      expect(result).toEqual({ exclude: ["page*", "layout*"] });
    });

    it("should handle mixed arguments", () => {
      const result = parseIncludeExclude([
        "--include",
        "button*",
        "--exclude",
        "page*",
        "--include",
        "form*",
        "--exclude",
        "layout*",
      ]);
      expect(result).toEqual({
        include: ["button*", "form*"],
        exclude: ["page*", "layout*"],
      });
    });

    it("should handle arguments with spaces", () => {
      const result = parseIncludeExclude([
        "--include",
        "button*, form*, input*",
      ]);
      expect(result).toEqual({ include: ["button*", "form*", "input*"] });
    });

    it("should filter out empty values", () => {
      const result = parseIncludeExclude(["--include", "button*,,form*,"]);
      expect(result).toEqual({ include: ["button*", "form*"] });
    });

    it("should handle arguments without values", () => {
      const result = parseIncludeExclude(["--include"]);
      expect(result).toEqual({});
    });

    it("should handle arguments with values starting with --", () => {
      const result = parseIncludeExclude(["--include", "--some-other-flag"]);
      expect(result).toEqual({});
    });

    it("should parse json argument with value", () => {
      const result = parseIncludeExclude(["--json", "output.json"]);
      expect(result).toEqual({ json: "output.json" });
    });

    it("should parse json argument without value", () => {
      const result = parseIncludeExclude(["--json"]);
      expect(result).toEqual({ json: true });
    });

    it("should parse dry-run argument", () => {
      const result = parseIncludeExclude(["--dry-run"]);
      expect(result).toEqual({ dryRun: true });
    });

    it("should handle complex argument combinations", () => {
      const result = parseIncludeExclude([
        "--include",
        "button*,form*",
        "--exclude",
        "page*,layout*",
        "--json",
        "report.json",
        "--dry-run",
      ]);
      expect(result).toEqual({
        include: ["button*", "form*"],
        exclude: ["page*", "layout*"],
        json: "report.json",
        dryRun: true,
      });
    });

    it("should handle unknown arguments", () => {
      const result = parseIncludeExclude([
        "--unknown",
        "value",
        "--include",
        "button*",
      ]);
      expect(result).toEqual({ include: ["button*"] });
    });

    it("should handle arguments at the end", () => {
      const result = parseIncludeExclude([
        "some",
        "other",
        "args",
        "--include",
        "button*",
      ]);
      expect(result).toEqual({ include: ["button*"] });
    });

    it("should handle multiple json arguments", () => {
      const result = parseIncludeExclude([
        "--json",
        "first.json",
        "--json",
        "second.json",
      ]);
      expect(result).toEqual({ json: "second.json" });
    });

    it("should handle whitespace in values", () => {
      const result = parseIncludeExclude(["--include", " button* , form* "]);
      expect(result).toEqual({ include: ["button*", "form*"] });
    });

    it("should handle empty string values", () => {
      const result = parseIncludeExclude(["--include", ""]);
      expect(result).toEqual({});
    });

    it("should handle only whitespace values", () => {
      const result = parseIncludeExclude(["--include", "   "]);
      expect(result).toEqual({ include: [] });
    });
  });

  describe("splitArg", () => {
    it("should split comma-separated values", () => {
      // This tests the internal splitArg function indirectly
      const result = parseIncludeExclude(["--include", "a,b,c"]);
      expect(result.include).toEqual(["a", "b", "c"]);
    });

    it("should handle single values", () => {
      const result = parseIncludeExclude(["--include", "single"]);
      expect(result.include).toEqual(["single"]);
    });

    it("should handle empty values", () => {
      const result = parseIncludeExclude(["--include", ""]);
      expect(result.include).toBeUndefined();
    });

    it("should handle undefined values", () => {
      const result = parseIncludeExclude(["--include"]);
      expect(result.include).toBeUndefined();
    });
  });

  describe("ParsedArgs type", () => {
    it("should accept valid ParsedArgs objects", () => {
      const validArgs: ParsedArgs = {
        include: ["button*"],
        exclude: ["page*"],
        json: "output.json",
        dryRun: true,
      };

      expect(validArgs).toBeDefined();
    });

    it("should accept partial ParsedArgs objects", () => {
      const partialArgs: ParsedArgs = {
        include: ["button*"],
      };

      expect(partialArgs).toBeDefined();
    });

    it("should accept empty ParsedArgs objects", () => {
      const emptyArgs: ParsedArgs = {};

      expect(emptyArgs).toBeDefined();
    });
  });
});
