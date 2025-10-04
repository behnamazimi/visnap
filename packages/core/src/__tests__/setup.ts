import { setupServer } from "msw/node";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";

import { handlers } from "./__mocks__/handlers";

// Setup MSW for HTTP mocking
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Mock process.exit to prevent actual exit during tests
const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
  throw new Error("process.exit() was called");
});

// Mock process.argv for CLI tests
Object.defineProperty(process, "argv", {
  value: ["node", "visual-testing-tool"],
  writable: true,
});

// Global test utilities
(global as any).mockExit = mockExit;
