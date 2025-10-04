import { describe, it, expect, vi, beforeEach } from "vitest";

import logger from "../../utils/logger";

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Replace console with mock
Object.defineProperty(global, "console", {
  value: mockConsole,
  writable: true,
});

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("plain", () => {
    it("should log message without formatting", () => {
      logger.plain("test message");
      expect(mockConsole.log).toHaveBeenCalledWith("test message");
    });
  });

  describe("info", () => {
    it("should log info message with cyan prefix", () => {
      logger.info("test message");
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("i test message")
      );
    });
  });

  describe("warn", () => {
    it("should log warning message with yellow prefix", () => {
      logger.warn("test message");
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining("! test message")
      );
    });
  });

  describe("success", () => {
    it("should log success message with green checkmark", () => {
      logger.success("test message");
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("✔ test message")
      );
    });
  });

  describe("error", () => {
    it("should log error message with red X", () => {
      logger.error("test message");
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("✖ test message")
      );
    });
  });

  describe("dim", () => {
    it("should log dimmed message", () => {
      logger.dim("test message");
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("test message")
      );
    });
  });

  describe("debug", () => {
    it("should log debug message with bug emoji", () => {
      logger.debug("test message");
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("🐛 test message")
      );
    });

    it("should log debug message with additional arguments", () => {
      const obj = { key: "value" };
      logger.debug("test message", obj);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("🐛 test message"),
        obj
      );
    });
  });

  describe("logger object", () => {
    it("should be frozen", () => {
      expect(Object.isFrozen(logger)).toBe(true);
    });

    it("should have all required methods", () => {
      expect(typeof logger.plain).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.success).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.dim).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });
  });
});
