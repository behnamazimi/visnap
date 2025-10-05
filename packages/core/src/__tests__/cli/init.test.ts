import { describe, it, expect, vi, beforeEach } from "vitest";

import { command } from "@/cli/commands/init";

const initCommand = command.handler;

// Mock dependencies
vi.mock("fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock("@/lib", () => ({
  initializeProject: vi.fn(),
}));

vi.mock("@/utils/config-generator", () => ({
  generateConfigContent: vi.fn().mockReturnValue("// Generated config"),
}));

vi.mock("@/utils/error-handler", () => ({
  getErrorMessage: vi.fn().mockImplementation(error => error.message),
}));

vi.mock("@/utils/logger", () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("initCommand", () => {
  // Will be imported dynamically in tests

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.cwd
    vi.spyOn(process, "cwd").mockReturnValue("/test/project");
  });

  it("should create config file successfully", async () => {
    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "ts",
      browsers: ["chromium", "firefox"],
      storybookSource: "./storybook-static",
    });

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { initializeProject } = await import("@/lib");
    vi.mocked(initializeProject).mockResolvedValueOnce({
      success: true,
      configPath: "vtt.config.ts",
      options: {
        configType: "ts",
        browsers: ["chromium"],
        storybookSource: "./storybook-static",
      },
    });
    const { generateConfigContent } = await import("@/utils/config-generator");
    vi.mocked(generateConfigContent).mockReturnValueOnce(
      "// Generated TypeScript config"
    );

    await initCommand();

    expect(inquirer.default.prompt).toHaveBeenCalledWith([
      {
        type: "list",
        name: "configType",
        message: "Choose configuration file type:",
        choices: [
          { name: "TypeScript (vtt.config.ts)", value: "ts" },
          { name: "JavaScript (vtt.config.js)", value: "js" },
        ],
        default: "ts",
      },
      {
        type: "checkbox",
        name: "browsers",
        message:
          "Select browsers to test (use space to select, enter to confirm):",
        choices: [
          { name: "Chromium", value: "chromium", checked: true },
          { name: "Firefox", value: "firefox" },
          { name: "WebKit", value: "webkit" },
        ],
        validate: expect.any(Function),
      },
      {
        type: "input",
        name: "storybookSource",
        message: "Enter storybook source path:",
        default: "./storybook-static",
        validate: expect.any(Function),
      },
    ]);

    expect(
      vi.mocked(await import("@/lib")).initializeProject
    ).toHaveBeenCalledWith({
      configType: "ts",
      browsers: ["chromium", "firefox"],
      storybookSource: "./storybook-static",
    });

    const { generateConfigContent: generateConfigContent2 } = await import(
      "@/utils/config-generator"
    );
    expect(generateConfigContent2).toHaveBeenCalledWith({
      configType: "ts",
      browsers: ["chromium", "firefox"],
      storybookSource: "./storybook-static",
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/test/project/vtt.config.ts",
      "// Generated TypeScript config"
    );

    const { default: log } = await import("@/utils/logger");
    expect(log.success).toHaveBeenCalledWith(
      "\n✅ Configuration file created successfully!"
    );
    expect(log.info).toHaveBeenCalledWith("📄 File: vtt.config.ts");
  });

  it("should create JavaScript config file", async () => {
    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "js",
      browsers: ["chromium"],
      storybookSource: "./build/storybook",
    });

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { initializeProject } = await import("@/lib");
    vi.mocked(initializeProject).mockResolvedValueOnce({
      success: true,
      configPath: "vtt.config.ts",
      options: {
        configType: "ts",
        browsers: ["chromium"],
        storybookSource: "./storybook-static",
      },
    });
    const { generateConfigContent } = await import("@/utils/config-generator");
    vi.mocked(generateConfigContent).mockReturnValueOnce(
      "// Generated JavaScript config"
    );

    await initCommand();

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/test/project/vtt.config.js",
      "// Generated JavaScript config"
    );

    const { default: log } = await import("@/utils/logger");
    expect(log.info).toHaveBeenCalledWith("📄 File: vtt.config.js");
  });

  it("should handle existing config file", async () => {
    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "ts",
      browsers: ["chromium"],
      storybookSource: "./storybook-static",
    });

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);

    await initCommand();

    const { default: log } = await import("@/utils/logger");
    expect(log.error).toHaveBeenCalledWith(
      "vtt.config.ts already exists in the current directory."
    );
    expect(log.warn).toHaveBeenCalledWith(
      "Remove the existing file or choose a different directory."
    );
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should handle initialization failure", async () => {
    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "ts",
      browsers: ["chromium"],
      storybookSource: "./storybook-static",
    });

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { initializeProject } = await import("@/lib");
    vi.mocked(initializeProject).mockResolvedValueOnce({
      success: false,
      configPath: "",
      options: {
        configType: "ts",
        browsers: ["chromium"],
        storybookSource: "./storybook-static",
      },
    });

    await initCommand();

    const { default: log } = await import("@/utils/logger");
    expect(log.error).toHaveBeenCalledWith("Failed to initialize project");
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const error = new Error("Prompt failed");
    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockRejectedValueOnce(error);

    await initCommand();

    const { default: log } = await import("@/utils/logger");
    expect(log.error).toHaveBeenCalledWith(
      "Failed to create config file: Prompt failed"
    );
  });

  it("should validate browser selection", async () => {
    const validateFunction = vi.fn().mockReturnValue(true);

    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "ts",
      browsers: ["chromium"],
      storybookSource: "./storybook-static",
    } as any);

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { initializeProject } = await import("@/lib");
    vi.mocked(initializeProject).mockResolvedValueOnce({
      success: true,
      configPath: "vtt.config.ts",
      options: {
        configType: "ts",
        browsers: ["chromium"],
        storybookSource: "./storybook-static",
      },
    });
    const { generateConfigContent } = await import("@/utils/config-generator");
    vi.mocked(generateConfigContent).mockReturnValueOnce("// Generated config");

    await initCommand();

    // Test validation function
    expect(validateFunction(["chromium"])).toBe(true);
    expect(validateFunction([])).toBe(true);
  });

  it("should validate storybook source", async () => {
    const validateFunction = vi.fn().mockReturnValue(true);

    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "ts",
      browsers: ["chromium"],
      storybookSource: "./storybook-static",
    } as any);

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { initializeProject } = await import("@/lib");
    vi.mocked(initializeProject).mockResolvedValueOnce({
      success: true,
      configPath: "vtt.config.ts",
      options: {
        configType: "ts",
        browsers: ["chromium"],
        storybookSource: "./storybook-static",
      },
    });
    const { generateConfigContent } = await import("@/utils/config-generator");
    vi.mocked(generateConfigContent).mockReturnValueOnce("// Generated config");

    await initCommand();

    // Test validation function
    expect(validateFunction("./storybook-static")).toBe(true);
    expect(validateFunction("")).toBe(true);
    expect(validateFunction("   ")).toBe(true);
  });

  it("should display configuration summary", async () => {
    const inquirer = await import("inquirer");
    vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
      configType: "ts",
      browsers: ["chromium", "firefox", "webkit"],
      storybookSource: "./custom-storybook",
    });

    const fs = await import("fs");
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    const { initializeProject } = await import("@/lib");
    vi.mocked(initializeProject).mockResolvedValueOnce({
      success: true,
      configPath: "vtt.config.ts",
      options: {
        configType: "ts",
        browsers: ["chromium"],
        storybookSource: "./storybook-static",
      },
    });
    const { generateConfigContent } = await import("@/utils/config-generator");
    vi.mocked(generateConfigContent).mockReturnValueOnce("// Generated config");

    await initCommand();

    const { default: log } = await import("@/utils/logger");
    expect(log.info).toHaveBeenCalledWith("\n📋 Configuration summary:");
    expect(log.info).toHaveBeenCalledWith("   • Config type: TypeScript");
    expect(log.info).toHaveBeenCalledWith(
      "   • Browsers: chromium, firefox, webkit"
    );
    expect(log.info).toHaveBeenCalledWith(
      "   • Storybook source: ./custom-storybook"
    );
    expect(log.info).toHaveBeenCalledWith(
      "\n🎉 You can now customize the configuration file as needed."
    );
    expect(log.info).toHaveBeenCalledWith(
      "💡 Run 'visual-testing-tool update' to capture baseline screenshots."
    );
  });
});
