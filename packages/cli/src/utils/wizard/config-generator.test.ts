import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockAdapterSelection } from "../../__mocks__/mock-cli-factories";

import { generateConfigFromSelection } from "./config-generator";

// Mock the core function
vi.mock("@visnap/core", () => ({
  generateConfigContent: vi.fn((options: any) => {
    return `// Generated config for ${options.configType} with threshold ${options.threshold}`;
  }),
}));

describe("config-generator", () => {
  let mockGenerateConfigContent: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked function
    const core = await import("@visnap/core");
    mockGenerateConfigContent = vi.mocked(core.generateConfigContent);
  });

  describe("generateConfigFromSelection", () => {
    it("should generate config with TypeScript type", () => {
      const selection = createMockAdapterSelection({
        configType: "ts",
        threshold: 0.1,
      });

      const result = generateConfigFromSelection(selection);

      expect(result).toContain("// Generated config for ts with threshold 0.1");
    });

    it("should generate config with JavaScript type", () => {
      const selection = createMockAdapterSelection({
        configType: "js",
        threshold: 0.2,
      });

      const result = generateConfigFromSelection(selection);

      expect(result).toContain("// Generated config for js with threshold 0.2");
    });

    it("should use custom threshold value", () => {
      const selection = createMockAdapterSelection({
        configType: "ts",
        threshold: 0.05,
      });

      const result = generateConfigFromSelection(selection);

      expect(result).toContain(
        "// Generated config for ts with threshold 0.05"
      );
    });

    it("should handle default values", () => {
      const selection = createMockAdapterSelection();

      const result = generateConfigFromSelection(selection);

      expect(result).toContain("// Generated config for ts with threshold 0.1");
    });

    it("should call generateConfigContent with correct options", () => {
      const selection = createMockAdapterSelection({
        configType: "js",
        threshold: 0.15,
      });

      generateConfigFromSelection(selection);

      expect(mockGenerateConfigContent).toHaveBeenCalledWith({
        configType: "js",
        threshold: 0.15,
      });
    });

    it("should handle different adapter selections", () => {
      const playwrightSelection = createMockAdapterSelection({
        browserAdapter: "playwright",
        testCaseAdapter: "storybook",
        browsers: ["chromium", "firefox"],
        threshold: 0.1,
      });

      const urlSelection = createMockAdapterSelection({
        browserAdapter: "playwright",
        testCaseAdapter: "url",
        browsers: ["webkit"],
        threshold: 0.2,
      });

      const result1 = generateConfigFromSelection(playwrightSelection);
      const result2 = generateConfigFromSelection(urlSelection);

      expect(result1).toContain(
        "// Generated config for ts with threshold 0.1"
      );
      expect(result2).toContain(
        "// Generated config for ts with threshold 0.2"
      );
    });

    it("should return string result", () => {
      const selection = createMockAdapterSelection();

      const result = generateConfigFromSelection(selection);

      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
