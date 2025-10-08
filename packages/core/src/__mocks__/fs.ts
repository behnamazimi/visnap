import { vi } from "vitest";

// Only mock the fs functions that are actually used in the codebase
export const existsSync = vi.fn();
export const mkdirSync = vi.fn();
export const writeFileSync = vi.fn();
export const readdirSync = vi.fn();

// Mock fs/promises functions that are used
export const promises = {
  writeFile: vi.fn(),
  unlink: vi.fn(),
};
