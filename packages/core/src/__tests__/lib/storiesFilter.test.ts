import { describe, it, expect } from "vitest";

import { createStoryFilter, type StoryLike } from "@/lib/storiesFilter";

describe("createStoryFilter", () => {
  const mockStories: StoryLike[] = [
    { id: "example-button--primary", title: "Example/Button" },
    { id: "example-button--secondary", title: "Example/Button" },
    { id: "example-header--logged-in", title: "Example/Header" },
    { id: "example-header--logged-out", title: "Example/Header" },
    { id: "example-page--default", title: "Example/Page" },
    { id: "test-component--variant", title: "Test/Component" },
  ];

  describe("include patterns", () => {
    it("should include all stories when no include patterns provided", () => {
      const filter = createStoryFilter({});
      const filtered = mockStories.filter(filter);
      expect(filtered).toEqual(mockStories);
    });

    it("should include stories matching id patterns", () => {
      const filter = createStoryFilter({ include: ["example-button--*"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(s => s.id)).toEqual([
        "example-button--primary",
        "example-button--secondary",
      ]);
    });

    it("should include stories matching title patterns", () => {
      const filter = createStoryFilter({ include: ["Example/Button"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(s => s.id)).toEqual([
        "example-button--primary",
        "example-button--secondary",
      ]);
    });

    it("should support wildcard patterns in titles", () => {
      const filter = createStoryFilter({ include: ["Example/*"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(5);
      expect(filtered.map(s => s.id)).toEqual([
        "example-button--primary",
        "example-button--secondary",
        "example-header--logged-in",
        "example-header--logged-out",
        "example-page--default",
      ]);
    });

    it("should support multiple include patterns", () => {
      const filter = createStoryFilter({
        include: ["example-button--*", "test-component--*"],
      });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(s => s.id)).toEqual([
        "example-button--primary",
        "example-button--secondary",
        "test-component--variant",
      ]);
    });

    it("should handle array of include patterns", () => {
      const filter = createStoryFilter({
        include: ["example-button--*", "example-header--*"],
      });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(4);
    });

    it("should be case-sensitive", () => {
      const filter = createStoryFilter({ include: ["example/button"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("exclude patterns", () => {
    it("should exclude stories matching id patterns", () => {
      const filter = createStoryFilter({ exclude: ["example-button--*"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(4);
      expect(filtered.map(s => s.id)).toEqual([
        "example-header--logged-in",
        "example-header--logged-out",
        "example-page--default",
        "test-component--variant",
      ]);
    });

    it("should exclude stories matching title patterns", () => {
      const filter = createStoryFilter({ exclude: ["Example/Button"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(4);
      expect(filtered.map(s => s.id)).toEqual([
        "example-header--logged-in",
        "example-header--logged-out",
        "example-page--default",
        "test-component--variant",
      ]);
    });

    it("should support wildcard patterns in titles for exclusion", () => {
      const filter = createStoryFilter({ exclude: ["Example/*"] });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(1);
      expect(filtered.map(s => s.id)).toEqual(["test-component--variant"]);
    });

    it("should support multiple exclude patterns", () => {
      const filter = createStoryFilter({
        exclude: ["example-button--*", "test-component--*"],
      });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(s => s.id)).toEqual([
        "example-header--logged-in",
        "example-header--logged-out",
        "example-page--default",
      ]);
    });
  });

  describe("include and exclude combinations", () => {
    it("should apply include first, then exclude", () => {
      const filter = createStoryFilter({
        include: ["example-*"],
        exclude: ["example-button--*"],
      });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(s => s.id)).toEqual([
        "example-header--logged-in",
        "example-header--logged-out",
        "example-page--default",
      ]);
    });

    it("should handle complex patterns", () => {
      const filter = createStoryFilter({
        include: ["Example/*"],
        exclude: ["*--logged-out", "example-page--*"],
      });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(3);
      expect(filtered.map(s => s.id)).toEqual([
        "example-button--primary",
        "example-button--secondary",
        "example-header--logged-in",
      ]);
    });

    it("should return empty array when all stories are excluded", () => {
      const filter = createStoryFilter({
        include: ["*"],
        exclude: ["*"],
      });
      const filtered = mockStories.filter(filter);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty story list", () => {
      const filter = createStoryFilter({ include: ["*"] });
      const filtered: StoryLike[] = [];
      const result = filtered.filter(filter);
      expect(result).toEqual([]);
    });

    it("should handle stories with special characters in id", () => {
      const specialStories: StoryLike[] = [
        {
          id: "component-with-dashes--variant",
          title: "Component/With/Dashes",
        },
        {
          id: "component_with_underscores--variant",
          title: "Component/With/Underscores",
        },
      ];

      const filter = createStoryFilter({ include: ["component-*"] });
      const filtered = specialStories.filter(filter);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("component-with-dashes--variant");
    });

    it("should handle stories with special characters in title", () => {
      const specialStories: StoryLike[] = [
        { id: "test--special", title: "Test/Component (Special)" },
        { id: "test--normal", title: "Test/Component" },
      ];

      const filter = createStoryFilter({ include: ["Test/Component*"] });
      const filtered = specialStories.filter(filter);
      expect(filtered).toHaveLength(2);
    });
  });
});
