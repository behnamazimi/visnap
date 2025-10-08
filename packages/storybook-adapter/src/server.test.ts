import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createServerManager } from "./server.js";

// Mock dependencies
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("node:http", () => ({
  default: {
    createServer: vi.fn(),
  },
}));

vi.mock("serve-handler", () => ({
  default: vi.fn(),
}));

import { existsSync } from "node:fs";
import http from "node:http";
// import handler from "serve-handler";

const mockExistsSync = vi.mocked(existsSync);
const mockCreateServer = vi.mocked(http.createServer);
// const mockHandler = vi.mocked(handler);

describe("server", () => {
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock server
    mockServer = {
      once: vi.fn(),
      listen: vi.fn(),
      close: vi.fn(),
      off: vi.fn(),
    };

    mockCreateServer.mockReturnValue(mockServer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createServerManager", () => {
    describe("URL source", () => {
      it("should use URL directly without starting server", async () => {
        const manager = createServerManager("https://example.com", 3000);

        await manager.ensureStarted();

        expect(mockExistsSync).not.toHaveBeenCalled();
        expect(mockCreateServer).not.toHaveBeenCalled();
        expect(manager.getBaseUrl()).toBe("https://example.com");
      });

      it("should remove trailing slash from URL", async () => {
        const manager = createServerManager("https://example.com/", 3000);

        await manager.ensureStarted();

        expect(manager.getBaseUrl()).toBe("https://example.com");
      });

      it("should handle HTTP URLs", async () => {
        const manager = createServerManager("http://localhost:3000", 3000);

        await manager.ensureStarted();

        expect(manager.getBaseUrl()).toBe("http://localhost:3000");
      });
    });

    describe("directory source", () => {
      it("should start server for existing directory", async () => {
        mockExistsSync.mockReturnValue(true);
        mockServer.listen.mockImplementation(
          (_port: any, callback: () => void) => {
            callback();
          }
        );

        const manager = createServerManager("/path/to/storybook", 3000);

        await manager.ensureStarted();

        expect(mockExistsSync).toHaveBeenCalledWith("/path/to/storybook");
        expect(mockCreateServer).toHaveBeenCalled();
        // The handler is called inside the createServer callback, so we verify the createServer was called with a function
        expect(mockCreateServer).toHaveBeenCalledWith(expect.any(Function));
        expect(mockServer.listen).toHaveBeenCalledWith(
          3000,
          expect.any(Function)
        );
        expect(manager.getBaseUrl()).toBe("http://localhost:3000");
      });

      it("should use default port when not specified", async () => {
        mockExistsSync.mockReturnValue(true);
        mockServer.listen.mockImplementation(
          (_port: any, callback: () => void) => {
            callback();
          }
        );

        const manager = createServerManager("/path/to/storybook");

        await manager.ensureStarted();

        expect(mockServer.listen).toHaveBeenCalledWith(
          6006,
          expect.any(Function)
        );
        expect(manager.getBaseUrl()).toBe("http://localhost:6006");
      });

      it("should throw error for non-existent directory", async () => {
        mockExistsSync.mockReturnValue(false);

        const manager = createServerManager("/nonexistent/path");

        await expect(manager.ensureStarted()).rejects.toThrow(
          "Storybook static directory not found: /nonexistent/path"
        );
      });

      it("should handle server start timeout", async () => {
        mockExistsSync.mockReturnValue(true);
        mockServer.listen.mockImplementation(
          (_port: any, _callback: () => void) => {
            // Don't call callback, simulating timeout
          }
        );

        const manager = createServerManager("/path/to/storybook");

        await expect(manager.ensureStarted()).rejects.toThrow(
          "Server start timed out"
        );
      });

      it("should handle server start error", async () => {
        mockExistsSync.mockReturnValue(true);
        const error = new Error("Port already in use");
        mockServer.listen.mockImplementation(
          (_port: any, _callback: () => void) => {
            // Simulate error event
            setTimeout(() => {
              const errorHandler = mockServer.once.mock.calls.find(
                (call: any) => call[0] === "error"
              )?.[1];
              if (errorHandler) {
                errorHandler(error);
              }
            }, 0);
          }
        );

        const manager = createServerManager("/path/to/storybook");

        await expect(manager.ensureStarted()).rejects.toThrow(
          "Port already in use"
        );
      });

      it("should not start server multiple times", async () => {
        mockExistsSync.mockReturnValue(true);
        mockServer.listen.mockImplementation(
          (_port: any, callback: () => void) => {
            callback();
          }
        );

        const manager = createServerManager("/path/to/storybook");

        await manager.ensureStarted();
        await manager.ensureStarted();

        expect(mockCreateServer).toHaveBeenCalledTimes(1);
        expect(mockServer.listen).toHaveBeenCalledTimes(1);
      });
    });

    describe("stop", () => {
      it("should stop server and clear baseUrl", async () => {
        mockExistsSync.mockReturnValue(true);
        mockServer.listen.mockImplementation(
          (_port: any, callback: () => void) => {
            callback();
          }
        );
        mockServer.close.mockImplementation((callback: () => void) => {
          callback();
        });

        const manager = createServerManager("/path/to/storybook");

        await manager.ensureStarted();
        expect(manager.getBaseUrl()).toBe("http://localhost:6006");

        await manager.stop();
        expect(mockServer.close).toHaveBeenCalled();
        expect(manager.getBaseUrl()).toBeUndefined();
      });

      it("should handle stop when no server is running", async () => {
        const manager = createServerManager("https://example.com");

        await manager.ensureStarted();
        await manager.stop();

        expect(mockServer.close).not.toHaveBeenCalled();
        expect(manager.getBaseUrl()).toBeUndefined();
      });

      it("should be safe to call multiple times", async () => {
        mockExistsSync.mockReturnValue(true);
        mockServer.listen.mockImplementation(
          (_port: any, callback: () => void) => {
            callback();
          }
        );
        mockServer.close.mockImplementation((callback: () => void) => {
          callback();
        });

        const manager = createServerManager("/path/to/storybook");

        await manager.ensureStarted();
        await manager.stop();
        await manager.stop();

        expect(mockServer.close).toHaveBeenCalledTimes(1);
      });
    });
  });
});
