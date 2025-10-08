import { describe, it, expect } from "vitest";

import { loadCommands } from "../command-loader";

describe("command-loader", () => {
  it("loads commands from registry with valid structure", async () => {
    const commands = await loadCommands();
    expect(commands).toBeTruthy();
    expect(Object.keys(commands).length).toBeGreaterThan(0);
    expect(commands.init.name).toBe("init");
    expect(typeof commands.init.handler).toBe("function");
  });
});
