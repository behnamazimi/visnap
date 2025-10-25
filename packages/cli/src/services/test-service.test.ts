import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createMockTestServiceResult,
  createMockCommandOptions,
} from "../__mocks__/mock-cli-factories";

import { TestService } from "./test-service";

// Mock the external dependencies
vi.mock("@visnap/core", () => ({
  runVisualTestsCli: vi.fn(),
  runInDocker: vi.fn(),
  DEFAULT_DOCKER_IMAGE: "visnap/test:latest",
}));

const mockJsonReporterGenerate = vi.fn();
const mockHtmlReporterGenerate = vi.fn();

vi.mock("@visnap/reporter", () => ({
  JsonReporter: class {
    generate = mockJsonReporterGenerate;
  },
  HtmlReporter: class {
    generate = mockHtmlReporterGenerate;
  },
}));

describe("TestService", () => {
  let testService: TestService;
  let mockRunVisualTestsCli: any;
  let mockRunInDocker: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    testService = new TestService();

    // Get the mocked functions
    const core = await import("@visnap/core");
    mockRunVisualTestsCli = vi.mocked(core.runVisualTestsCli);
    mockRunInDocker = vi.mocked(core.runInDocker);
  });

  describe("executeTests", () => {
    it("should route to local execution when docker is false", async () => {
      const options = createMockCommandOptions({ docker: false });
      const expectedResult = createMockTestServiceResult();

      mockRunVisualTestsCli.mockResolvedValue(expectedResult);

      const result = await testService.executeTests(options);

      expect(mockRunVisualTestsCli).toHaveBeenCalledWith(
        {},
        {
          include: undefined,
          exclude: undefined,
        }
      );
      expect(result).toEqual(expectedResult);
    });

    it("should route to docker execution when docker is true", async () => {
      const options = createMockCommandOptions({ docker: true });

      mockRunInDocker.mockResolvedValue(0);

      const result = await testService.executeTests(options);

      expect(mockRunInDocker).toHaveBeenCalledWith({
        image: "visnap/test:latest",
        args: ["test"],
      });
      expect(result).toEqual({
        success: true,
        exitCode: 0,
        outcome: {
          total: 0,
          passed: 0,
          failedDiffs: 0,
          failedErrors: 0,
          captureFailures: 0,
        },
      });
    });
  });

  describe("executeTestsLocally", () => {
    it("should execute tests and generate reports when enabled", async () => {
      const options = createMockCommandOptions({
        jsonReport: true,
        htmlReport: true,
        config: "/custom/config.ts",
      });

      const testResult = createMockTestServiceResult({
        config: {
          screenshotDir: "./custom-visnap",
          reporter: { html: true, json: true },
        },
      });

      mockRunVisualTestsCli.mockResolvedValue(testResult);

      const result = await testService.executeTests(options);

      expect(mockRunVisualTestsCli).toHaveBeenCalledWith(
        {},
        {
          include: undefined,
          exclude: undefined,
          configPath: "/custom/config.ts",
        }
      );

      // Should generate JSON report
      expect(mockJsonReporterGenerate).toHaveBeenCalledWith(testResult, {
        outputPath: "./custom-visnap/report.json",
        screenshotDir: "./custom-visnap",
        pretty: true,
      });

      // Should generate HTML report
      expect(mockHtmlReporterGenerate).toHaveBeenCalledWith(testResult, {
        outputPath: "./custom-visnap/report.html",
        screenshotDir: "./custom-visnap",
        title: "VISNAP Test Report",
      });

      expect(result).toEqual(testResult);
    });

    it("should not generate reports when disabled", async () => {
      const options = createMockCommandOptions({
        jsonReport: false,
        htmlReport: false,
      });

      const testResult = createMockTestServiceResult();
      mockRunVisualTestsCli.mockResolvedValue(testResult);

      await testService.executeTests(options);

      expect(mockJsonReporterGenerate).not.toHaveBeenCalled();
      expect(mockHtmlReporterGenerate).not.toHaveBeenCalled();
    });

    it("should use custom report paths when provided", async () => {
      const options = createMockCommandOptions({
        jsonReport: "/custom/json-report.json",
        htmlReport: "/custom/html-report.html",
      });

      const testResult = createMockTestServiceResult();
      mockRunVisualTestsCli.mockResolvedValue(testResult);

      await testService.executeTests(options);

      expect(mockJsonReporterGenerate).toHaveBeenCalledWith(
        testResult,
        expect.objectContaining({
          outputPath: "/custom/json-report.json",
        })
      );

      expect(mockHtmlReporterGenerate).toHaveBeenCalledWith(
        testResult,
        expect.objectContaining({
          outputPath: "/custom/html-report.html",
        })
      );
    });

    it("should handle missing config screenshotDir", async () => {
      const options = createMockCommandOptions({
        jsonReport: true,
        htmlReport: true,
      });

      const testResult = createMockTestServiceResult({
        config: {
          screenshotDir: undefined,
        },
      });

      mockRunVisualTestsCli.mockResolvedValue(testResult);

      await testService.executeTests(options);

      expect(mockJsonReporterGenerate).toHaveBeenCalledWith(
        testResult,
        expect.objectContaining({
          screenshotDir: "./visnap",
        })
      );

      expect(mockHtmlReporterGenerate).toHaveBeenCalledWith(
        testResult,
        expect.objectContaining({
          screenshotDir: "./visnap",
        })
      );
    });
  });

  describe("executeTestsInDocker", () => {
    it("should construct docker args correctly", async () => {
      const options = createMockCommandOptions({
        docker: true,
        config: "/custom/config.ts",
        jsonReport: "/custom/json.json",
        htmlReport: "/custom/html.html",
      });

      mockRunInDocker.mockResolvedValue(0);

      const result = await testService.executeTests(options);

      expect(mockRunInDocker).toHaveBeenCalledWith({
        image: "visnap/test:latest",
        args: [
          "test",
          "--config",
          "/custom/config.ts",
          "--jsonReport",
          "/custom/json.json",
          "--htmlReport",
          "/custom/html.html",
        ],
      });

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    it("should handle boolean report flags", async () => {
      const options = createMockCommandOptions({
        docker: true,
        jsonReport: true,
        htmlReport: true,
      });

      mockRunInDocker.mockResolvedValue(0);

      await testService.executeTests(options);

      expect(mockRunInDocker).toHaveBeenCalledWith({
        image: "visnap/test:latest",
        args: ["test", "--jsonReport", "--htmlReport"],
      });
    });

    it("should handle docker failure", async () => {
      const options = createMockCommandOptions({ docker: true });

      mockRunInDocker.mockResolvedValue(1);

      const result = await testService.executeTests(options);

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it("should not include config args when not provided", async () => {
      const options = createMockCommandOptions({ docker: true });

      mockRunInDocker.mockResolvedValue(0);

      await testService.executeTests(options);

      expect(mockRunInDocker).toHaveBeenCalledWith({
        image: "visnap/test:latest",
        args: ["test"],
      });
    });
  });
});
