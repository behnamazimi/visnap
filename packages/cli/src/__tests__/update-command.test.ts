import { describe, it, expect, vi, beforeEach } from "vitest";

import { command as updateCommand } from "../commands/update";

vi.mock("@visual-testing-tool/core", () => ({
  updateBaseline: vi.fn(async () => undefined),
  getErrorMessage: (e: unknown) => String(e),
  log: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    plain: vi.fn(),
  },
}));

vi.mock("../utils/exit", () => ({
  exit: vi.fn((code?: number) => {
    throw new Error(`EXIT:${code ?? 0}`);
  }),
}));

describe("update command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exits with 0 on success", async () => {
    await expect(updateCommand.handler({} as any)).rejects.toThrow("EXIT:0");
  });
});
