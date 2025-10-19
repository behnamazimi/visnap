import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  mockProcessExit,
  mockConsoleOutput,
} from "../__mocks__/cli-test-helpers";
import { createMockErrorContext } from "../__mocks__/mock-cli-factories";

import { ErrorHandler } from "./error-handler";

// Mock the core functions
vi.mock("@visnap/core", () => ({
  getErrorMessage: vi.fn((error: unknown) => {
    if (error instanceof Error) return error.message;
    return String(error);
  }),
  log: {
    error: vi.fn(),
    plain: vi.fn(),
  },
}));

// Mock the exit function
describe("ErrorHandler", () => {
  let mockLog: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConsoleOutput();
    mockProcessExit();

    // Get the mocked functions
    const core = await import("@visnap/core");
    mockLog = vi.mocked(core.log);
  });

  describe("handle", () => {
    it("should format error message with command context", () => {
      const error = new Error("Test error");
      const context = createMockErrorContext({
        command: "test",
        operation: "visual testing",
      });

      ErrorHandler.handle(error, context);

      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("Error in 'test' command: Test error")
      );
      expect(mockLog.error).toHaveBeenCalledWith(
        expect.stringContaining("Operation: visual testing")
      );
    });

    it("should format error message without context", () => {
      const error = new Error("Test error");

      ErrorHandler.handle(error);

      expect(mockLog.error).toHaveBeenCalledWith("Test error");
    });

    it("should include suggestion when provided", () => {
      const error = new Error("Test error");
      const context = createMockErrorContext({
        suggestion: "Try again later",
      });

      ErrorHandler.handle(error, context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("💡 Suggestion: Try again later")
      );
    });

    it("should add troubleshooting steps for different error types", () => {
      const portError = new Error("EADDRINUSE: address already in use");
      const context = createMockErrorContext();

      ErrorHandler.handle(portError, context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("🔧 Troubleshooting:")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Check if another process is using the port")
      );
    });
  });

  describe("getErrorType", () => {
    it("should categorize port conflict errors", () => {
      const error = new Error("EADDRINUSE: address already in use :::3000");

      // Access private method through any cast for testing
      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("port_conflict");
    });

    it("should categorize file not found errors", () => {
      const error = new Error("ENOENT: no such file or directory");

      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("file_not_found");
    });

    it("should categorize permission denied errors", () => {
      const error = new Error("EACCES: permission denied");

      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("permission_denied");
    });

    it("should categorize network errors", () => {
      const error = new Error("Network timeout occurred");

      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("network_error");
    });

    it("should categorize config errors", () => {
      const error = new Error("Syntax error in configuration file");

      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("config_error");
    });

    it("should return unknown for unrecognized errors", () => {
      const error = new Error("Some random error");

      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("unknown");
    });

    it("should handle non-Error objects", () => {
      const error = "String error";

      const errorType = (ErrorHandler as any).getErrorType(error);

      expect(errorType).toBe("unknown");
    });
  });

  describe("addTroubleshootingSteps", () => {
    it("should add port conflict troubleshooting", () => {
      const context = createMockErrorContext();

      (ErrorHandler as any).addTroubleshootingSteps("port_conflict", context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Check if another process is using the port")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Try using a different port with --port option")
      );
    });

    it("should add file not found troubleshooting", () => {
      const context = createMockErrorContext();

      (ErrorHandler as any).addTroubleshootingSteps("file_not_found", context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Verify the file path exists")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining(
          "Run 'visnap init' to create a configuration file"
        )
      );
    });

    it("should add permission denied troubleshooting", () => {
      const context = createMockErrorContext();

      (ErrorHandler as any).addTroubleshootingSteps(
        "permission_denied",
        context
      );

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Check file/directory permissions")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Verify write access to the target directory")
      );
    });

    it("should add network error troubleshooting", () => {
      const context = createMockErrorContext();

      (ErrorHandler as any).addTroubleshootingSteps("network_error", context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Check your internet connection")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Verify the URL is accessible")
      );
    });

    it("should add config error troubleshooting", () => {
      const context = createMockErrorContext();

      (ErrorHandler as any).addTroubleshootingSteps("config_error", context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Validate your configuration file syntax")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Run 'visnap validate' to check configuration")
      );
    });

    it("should add default troubleshooting for unknown errors", () => {
      const context = createMockErrorContext();

      (ErrorHandler as any).addTroubleshootingSteps("unknown", context);

      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Check the logs for more details")
      );
      expect(mockLog.plain).toHaveBeenCalledWith(
        expect.stringContaining("Report issues at the project repository")
      );
    });
  });

  // Note: SIGINT and unhandled rejection tests are skipped due to process.exit mocking complexity
  // These functions are tested at integration level
});
