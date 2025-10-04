import { vi } from "vitest";

export const mockPage = {
  close: vi.fn().mockResolvedValue(undefined),
  goto: vi.fn().mockResolvedValue(undefined),
  waitForLoadState: vi.fn().mockResolvedValue(undefined),
  evaluate: vi.fn().mockResolvedValue([]),
  screenshot: vi.fn().mockResolvedValue(Buffer.from("mock-screenshot")),
  setViewportSize: vi.fn().mockResolvedValue(undefined),
  waitForSelector: vi.fn().mockResolvedValue(undefined),
  locator: vi.fn().mockReturnValue({
    screenshot: vi.fn().mockResolvedValue(Buffer.from("mock-screenshot")),
  }),
};

export const mockContext = {
  close: vi.fn().mockResolvedValue(undefined),
  newPage: vi.fn().mockResolvedValue(mockPage),
};

// Mock Playwright browser and page objects
export const mockBrowser = {
  close: vi.fn().mockResolvedValue(undefined),
  newPage: vi.fn().mockResolvedValue(mockPage),
  newContext: vi.fn().mockResolvedValue(mockContext),
};

// Mock Playwright module
export const mockPlaywright = {
  chromium: {
    launch: vi.fn().mockResolvedValue(mockBrowser),
    connect: vi.fn().mockResolvedValue(mockBrowser),
  },
  firefox: {
    launch: vi.fn().mockResolvedValue(mockBrowser),
    connect: vi.fn().mockResolvedValue(mockBrowser),
  },
  webkit: {
    launch: vi.fn().mockResolvedValue(mockBrowser),
    connect: vi.fn().mockResolvedValue(mockBrowser),
  },
};

// Mock the entire playwright-core module
vi.mock("playwright-core", () => mockPlaywright);
