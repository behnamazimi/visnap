import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import logger from "./logger";

// Mock chalk
vi.mock("chalk", () => ({
  default: {
    cyan: vi.fn(text => `cyan(${text})`),
    yellow: vi.fn(text => `yellow(${text})`),
    green: vi.fn(text => `green(${text})`),
    red: vi.fn(text => `red(${text})`),
    dim: vi.fn(text => `dim(${text})`),
    gray: vi.fn(text => `gray(${text})`),
  },
}));

describe("logger", () => {
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe("plain", () => {
    it("should log message without formatting", () => {
      logger.plain("Test message");
      expect(console.log).toHaveBeenCalledWith("Test message");
    });
  });

  describe("info", () => {
    it("should log info message with cyan formatting", () => {
      logger.info("Test info");
      expect(console.log).toHaveBeenCalledWith("cyan(i) Test info");
    });
  });

  describe("warn", () => {
    it("should log warning message with yellow formatting", () => {
      logger.warn("Test warning");
      expect(console.warn).toHaveBeenCalledWith("yellow(!) Test warning");
    });
  });

  describe("success", () => {
    it("should log success message with green formatting", () => {
      logger.success("Test success");
      expect(console.log).toHaveBeenCalledWith("green(✔) Test success");
    });
  });

  describe("error", () => {
    it("should log error message with red formatting", () => {
      logger.error("Test error");
      expect(console.error).toHaveBeenCalledWith("red(✖) Test error");
    });
  });

  describe("dim", () => {
    it("should log dimmed message", () => {
      logger.dim("Test dim");
      expect(console.log).toHaveBeenCalledWith("dim(Test dim)");
    });
  });

  describe("debug", () => {
    it("should log debug message with gray formatting and additional args", () => {
      logger.debug("Test debug", "arg1", "arg2");
      expect(console.log).toHaveBeenCalledWith(
        "gray(🐛 Test debug)",
        "arg1",
        "arg2"
      );
    });
  });
});
