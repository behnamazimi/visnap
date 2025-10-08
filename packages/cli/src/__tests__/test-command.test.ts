import { describe, it, expect, vi, beforeEach } from "vitest";

import { command as testCommand } from "../commands/test";

vi.mock("@visual-testing-tool/core", () => ({
  runVisualTests: vi.fn(async () => ({
    success: true,
    outcome: "success",
    failures: [],
    captureFailures: [],
    exitCode: 0,
  })),
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

describe("test command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exits with 0 on success", async () => {
    await expect(testCommand.handler({} as any)).rejects.toThrow("EXIT:0");
  });

  it("prints json to stdout when --jsonReport provided without path", async () => {
    const spy = vi.spyOn(console, "log");
    try {
      await expect(
        testCommand.handler({ jsonReport: true } as any)
      ).rejects.toThrow("EXIT:0");
    } finally {
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    }
  });
});
