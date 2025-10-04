import { describe, it, expect } from "vitest";

import { parseIncludeExclude } from "../../utils/args";

describe("parseIncludeExclude", () => {
  it("should parse include patterns", () => {
    const result = parseIncludeExclude(["--include", "pattern1,pattern2"]);
    expect(result).toEqual({
      include: ["pattern1", "pattern2"],
    });
  });

  it("should parse exclude patterns", () => {
    const result = parseIncludeExclude(["--exclude", "pattern1,pattern2"]);
    expect(result).toEqual({
      exclude: ["pattern1", "pattern2"],
    });
  });

  it("should parse both include and exclude patterns", () => {
    const result = parseIncludeExclude([
      "--include",
      "pattern1",
      "--exclude",
      "pattern2",
    ]);
    expect(result).toEqual({
      include: ["pattern1"],
      exclude: ["pattern2"],
    });
  });

  it("should handle multiple include flags", () => {
    const result = parseIncludeExclude([
      "--include",
      "pattern1",
      "--include",
      "pattern2",
    ]);
    expect(result).toEqual({
      include: ["pattern1", "pattern2"],
    });
  });

  it("should handle multiple exclude flags", () => {
    const result = parseIncludeExclude([
      "--exclude",
      "pattern1",
      "--exclude",
      "pattern2",
    ]);
    expect(result).toEqual({
      exclude: ["pattern1", "pattern2"],
    });
  });

  it("should handle comma-separated patterns", () => {
    const result = parseIncludeExclude([
      "--include",
      "pattern1,pattern2,pattern3",
    ]);
    expect(result).toEqual({
      include: ["pattern1", "pattern2", "pattern3"],
    });
  });

  it("should trim whitespace from patterns", () => {
    const result = parseIncludeExclude(["--include", " pattern1 , pattern2 "]);
    expect(result).toEqual({
      include: ["pattern1", "pattern2"],
    });
  });

  it("should filter out empty patterns", () => {
    const result = parseIncludeExclude(["--include", "pattern1,,pattern2,"]);
    expect(result).toEqual({
      include: ["pattern1", "pattern2"],
    });
  });

  it("should handle json flag without value", () => {
    const result = parseIncludeExclude(["--json"]);
    expect(result).toEqual({
      json: true,
    });
  });

  it("should handle json flag with value", () => {
    const result = parseIncludeExclude(["--json", "report.json"]);
    expect(result).toEqual({
      json: "report.json",
    });
  });

  it("should handle dry-run flag", () => {
    const result = parseIncludeExclude(["--dry-run"]);
    expect(result).toEqual({
      dryRun: true,
    });
  });

  it("should handle complex argument combinations", () => {
    const result = parseIncludeExclude([
      "--include",
      "pattern1,pattern2",
      "--exclude",
      "pattern3",
      "--json",
      "report.json",
      "--dry-run",
    ]);
    expect(result).toEqual({
      include: ["pattern1", "pattern2"],
      exclude: ["pattern3"],
      json: "report.json",
      dryRun: true,
    });
  });

  it("should ignore flags without values when next token is another flag", () => {
    const result = parseIncludeExclude(["--include", "--exclude", "pattern"]);
    expect(result).toEqual({
      exclude: ["pattern"],
    });
  });

  it("should return empty object for no arguments", () => {
    const result = parseIncludeExclude([]);
    expect(result).toEqual({});
  });

  it("should ignore unknown flags", () => {
    const result = parseIncludeExclude([
      "--unknown",
      "value",
      "--include",
      "pattern",
    ]);
    expect(result).toEqual({
      include: ["pattern"],
    });
  });

  it("should handle mixed valid and invalid arguments", () => {
    const result = parseIncludeExclude([
      "--include",
      "pattern1",
      "--unknown",
      "value",
      "--exclude",
      "pattern2",
      "--dry-run",
    ]);
    expect(result).toEqual({
      include: ["pattern1"],
      exclude: ["pattern2"],
      dryRun: true,
    });
  });
});
