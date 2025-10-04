import { vi } from "vitest";

// Mock file system operations
export const mockFs = {
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  statSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmdirSync: vi.fn(),
  access: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
  rmdir: vi.fn(),
};

// Mock the fs module
vi.mock("fs", () => mockFs);
vi.mock("fs/promises", () => ({
  access: mockFs.access,
  mkdir: mockFs.mkdir,
  readFile: mockFs.readFile,
  writeFile: mockFs.writeFile,
  readdir: mockFs.readdir,
  stat: mockFs.stat,
  unlink: mockFs.unlink,
  rmdir: mockFs.rmdir,
}));
