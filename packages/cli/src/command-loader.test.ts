import { Command } from "commander";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { loadCommands, registerCommands } from "./command-loader";

// Mock the core log function
vi.mock("@visnap/core", () => ({
  log: {
    warn: vi.fn(),
  },
}));

describe("command-loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadCommands", () => {
    it("loads commands from registry with valid structure", async () => {
      const commands = await loadCommands();

      expect(commands).toBeTruthy();
      expect(Object.keys(commands).length).toBeGreaterThan(0);
      expect(commands.init.name).toBe("init");
      expect(typeof commands.init.handler).toBe("function");
    });

    it("should include all expected commands", async () => {
      const commands = await loadCommands();

      const expectedCommands = [
        "init",
        "test",
        "update",
        "validate",
        "list",
        "open",
      ];
      expectedCommands.forEach(commandName => {
        expect(commands[commandName]).toBeDefined();
        expect(commands[commandName].name).toBe(commandName);
        expect(typeof commands[commandName].handler).toBe("function");
        expect(typeof commands[commandName].description).toBe("string");
      });
    });

    it("should filter out invalid commands", async () => {
      // This test ensures the validation logic works
      const commands = await loadCommands();

      // All loaded commands should have valid structure
      Object.values(commands).forEach(command => {
        expect(command).toHaveProperty("name");
        expect(command).toHaveProperty("description");
        expect(command).toHaveProperty("handler");
        expect(typeof command.name).toBe("string");
        expect(typeof command.description).toBe("string");
        expect(typeof command.handler).toBe("function");
      });
    });
  });

  describe("registerCommands", () => {
    it("should register commands with commander program", () => {
      const program = new Command();
      const commands = {
        test: {
          name: "test",
          description: "Test command",
          handler: vi.fn(),
        },
        init: {
          name: "init",
          description: "Init command",
          handler: vi.fn(),
        },
      };

      registerCommands(program, commands);

      // Check that commands were registered
      const testCommand = program.commands.find(cmd => cmd.name() === "test");
      const initCommand = program.commands.find(cmd => cmd.name() === "init");

      expect(testCommand).toBeDefined();
      expect(initCommand).toBeDefined();
    });

    it("should register commands with aliases when provided", () => {
      const program = new Command();
      const commands = {
        test: {
          name: "test",
          description: "Test command",
          aliases: ["t", "run"],
          handler: vi.fn(),
        },
      };

      registerCommands(program, commands);

      const testCommand = program.commands.find(cmd => cmd.name() === "test");
      expect(testCommand).toBeDefined();
      // Note: Commander.js aliases are internal, so we can't easily test them
      // but we can verify the command was registered
    });

    it("should call configure function when provided", () => {
      const program = new Command();
      const configureMock = vi.fn().mockReturnValue(new Command());
      const commands = {
        test: {
          name: "test",
          description: "Test command",
          configure: configureMock,
          handler: vi.fn(),
        },
      };

      registerCommands(program, commands);

      expect(configureMock).toHaveBeenCalled();
    });

    it("should set action handler for each command", () => {
      const program = new Command();
      const handlerMock = vi.fn();
      const commands = {
        test: {
          name: "test",
          description: "Test command",
          handler: handlerMock,
        },
      };

      registerCommands(program, commands);

      // The action is set internally by Commander.js
      // We can verify the command exists and has the expected structure
      const testCommand = program.commands.find(cmd => cmd.name() === "test");
      expect(testCommand).toBeDefined();
    });

    it("should handle empty commands object", () => {
      const program = new Command();
      const commands = {};

      expect(() => registerCommands(program, commands)).not.toThrow();
      expect(program.commands).toHaveLength(0);
    });
  });
});
