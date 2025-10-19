import { describe, it, expect, beforeEach, vi } from "vitest";

import { OdiffEngine, PixelmatchEngine } from "./compare";
import {
  comparisonEngineRegistry,
  registerBuiltInEngines,
} from "./comparison-engine-registry";

describe("comparison-engine-registry", () => {
  beforeEach(() => {
    // Clear the registry before each test
    (comparisonEngineRegistry as any).engines.clear();
  });

  describe("comparisonEngineRegistry", () => {
    it("should start empty", () => {
      expect(comparisonEngineRegistry.getAll()).toEqual([]);
    });

    it("should register an engine", () => {
      const mockEngine = {
        name: "test-engine" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };

      comparisonEngineRegistry.register(mockEngine);

      expect(comparisonEngineRegistry.has("test-engine")).toBe(true);
      expect(comparisonEngineRegistry.get("test-engine")).toBe(mockEngine);
    });

    it("should get all registered engines", () => {
      const engine1 = {
        name: "engine1" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };
      const engine2 = {
        name: "engine2" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };

      comparisonEngineRegistry.register(engine1);
      comparisonEngineRegistry.register(engine2);

      const allEngines = comparisonEngineRegistry.getAll();
      expect(allEngines).toHaveLength(2);
      expect(allEngines).toContain(engine1);
      expect(allEngines).toContain(engine2);
    });

    it("should check if engine is registered", () => {
      const mockEngine = {
        name: "test-engine" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };

      expect(comparisonEngineRegistry.has("test-engine")).toBe(false);

      comparisonEngineRegistry.register(mockEngine);

      expect(comparisonEngineRegistry.has("test-engine")).toBe(true);
    });

    it("should throw error when getting unregistered engine", () => {
      expect(() => comparisonEngineRegistry.get("non-existent")).toThrow(
        "Comparison engine 'non-existent' not found. Available engines: "
      );
    });

    it("should list available engines in error message", () => {
      const engine1 = {
        name: "engine1" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };
      const engine2 = {
        name: "engine2" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };

      comparisonEngineRegistry.register(engine1);
      comparisonEngineRegistry.register(engine2);

      expect(() => comparisonEngineRegistry.get("non-existent")).toThrow(
        "Comparison engine 'non-existent' not found. Available engines: engine1, engine2"
      );
    });

    it("should overwrite existing engine with same name", () => {
      const engine1 = {
        name: "test-engine" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };
      const engine2 = {
        name: "test-engine" as const,
        compare: () => Promise.resolve({ match: false, reason: "pixel-diff" }),
      };

      comparisonEngineRegistry.register(engine1);
      comparisonEngineRegistry.register(engine2);

      expect(comparisonEngineRegistry.get("test-engine")).toBe(engine2);
      expect(comparisonEngineRegistry.getAll()).toHaveLength(1);
    });

    it("should handle multiple engines with different names", () => {
      const engine1 = {
        name: "engine1" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };
      const engine2 = {
        name: "engine2" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };
      const engine3 = {
        name: "engine3" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };

      comparisonEngineRegistry.register(engine1);
      comparisonEngineRegistry.register(engine2);
      comparisonEngineRegistry.register(engine3);

      expect(comparisonEngineRegistry.getAll()).toHaveLength(3);
      expect(comparisonEngineRegistry.has("engine1")).toBe(true);
      expect(comparisonEngineRegistry.has("engine2")).toBe(true);
      expect(comparisonEngineRegistry.has("engine3")).toBe(true);
    });
  });

  describe("registerBuiltInEngines", () => {
    it("should register odiff and pixelmatch engines", () => {
      registerBuiltInEngines();

      expect(comparisonEngineRegistry.has("odiff")).toBe(true);
      expect(comparisonEngineRegistry.has("pixelmatch")).toBe(true);
      expect(comparisonEngineRegistry.getAll()).toHaveLength(2);
    });

    it("should register engines as correct types", () => {
      registerBuiltInEngines();

      const odiffEngine = comparisonEngineRegistry.get("odiff");
      const pixelmatchEngine = comparisonEngineRegistry.get("pixelmatch");

      expect(odiffEngine).toBeInstanceOf(OdiffEngine);
      expect(pixelmatchEngine).toBeInstanceOf(PixelmatchEngine);
    });

    it("should be idempotent", () => {
      registerBuiltInEngines();
      const firstCall = comparisonEngineRegistry.getAll();

      registerBuiltInEngines();
      const secondCall = comparisonEngineRegistry.getAll();

      expect(firstCall).toEqual(secondCall);
      expect(comparisonEngineRegistry.getAll()).toHaveLength(2);
    });

    it("should not affect existing engines", () => {
      const customEngine = {
        name: "custom" as const,
        compare: () => Promise.resolve({ match: true, reason: "" }),
      };

      comparisonEngineRegistry.register(customEngine);
      registerBuiltInEngines();

      expect(comparisonEngineRegistry.has("custom")).toBe(true);
      expect(comparisonEngineRegistry.has("odiff")).toBe(true);
      expect(comparisonEngineRegistry.has("pixelmatch")).toBe(true);
      expect(comparisonEngineRegistry.getAll()).toHaveLength(3);
    });
  });

  describe("engine functionality", () => {
    it("should be able to use registered engines", async () => {
      const mockEngine = {
        name: "test-engine" as const,
        compare: vi.fn().mockResolvedValue({ match: true, reason: "" }),
      };

      comparisonEngineRegistry.register(mockEngine);
      const engine = comparisonEngineRegistry.get("test-engine");

      const mockStorage = {} as any;
      const result = await engine.compare(mockStorage, "path2", {
        threshold: 0.1,
      });

      expect(result).toEqual({ match: true, reason: "" });
      expect(mockEngine.compare).toHaveBeenCalledWith(mockStorage, "path2", {
        threshold: 0.1,
      });
    });

    it("should handle engine errors", async () => {
      const mockEngine = {
        name: "error-engine" as const,
        compare: vi.fn().mockRejectedValue(new Error("Engine error")),
      };

      comparisonEngineRegistry.register(mockEngine);
      const engine = comparisonEngineRegistry.get("error-engine");

      const mockStorage = {} as any;
      await expect(
        engine.compare(mockStorage, "path2", { threshold: 0.1 })
      ).rejects.toThrow("Engine error");
    });
  });
});
