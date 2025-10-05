import { vi } from "vitest";

// Mock the core package
vi.mock("@visual-testing-tool/core", () => ({
  initializeProject: vi.fn(),
  runTests: vi.fn(),
  updateBaseline: vi.fn(),
  getPackageInfo: vi.fn(),
}));

// Mock other dependencies
vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("child_process", () => ({
  spawn: vi.fn(),
}));
