import { describe, it, expect, vi } from "vitest";

import { createConcurrencyPool } from "./pool";

describe("pool", () => {
  describe("createConcurrencyPool", () => {
    it("should process items with specified concurrency", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 2 });
      const items = [1, 2, 3, 4, 5];
      const worker = vi
        .fn()
        .mockImplementation(async (item: number) => item * 2);

      const results = await runWithPool(items, worker);

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(worker).toHaveBeenCalledTimes(5);
    });

    it("should preserve input order in results", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 3 });
      const items = ["a", "b", "c", "d", "e"];
      const worker = vi
        .fn()
        .mockImplementation(
          async (item: string, index: number) => `${item}-${index}`
        );

      const results = await runWithPool(items, worker);

      expect(results).toEqual(["a-0", "b-1", "c-2", "d-3", "e-4"]);
    });

    it("should handle empty items array", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 2 });
      const items: number[] = [];
      const worker = vi.fn();

      const results = await runWithPool(items, worker);

      expect(results).toEqual([]);
      expect(worker).not.toHaveBeenCalled();
    });

    it("should handle single item", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 2 });
      const items = [42];
      const worker = vi
        .fn()
        .mockImplementation(async (item: number) => item * 2);

      const results = await runWithPool(items, worker);

      expect(results).toEqual([84]);
      expect(worker).toHaveBeenCalledTimes(1);
      expect(worker).toHaveBeenCalledWith(42, 0);
    });

    it("should handle concurrency greater than items length", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 10 });
      const items = [1, 2, 3];
      const worker = vi
        .fn()
        .mockImplementation(async (item: number) => item * 2);

      const results = await runWithPool(items, worker);

      expect(results).toEqual([2, 4, 6]);
      expect(worker).toHaveBeenCalledTimes(3);
    });

    it("should enforce minimum concurrency of 1", () => {
      expect(() => createConcurrencyPool({ concurrency: 0 })).toThrow(
        "Concurrency must be at least 1"
      );
    });

    it("should handle negative concurrency", () => {
      expect(() => createConcurrencyPool({ concurrency: -5 })).toThrow(
        "Concurrency must be at least 1"
      );
    });

    it("should handle fractional concurrency", () => {
      expect(() => createConcurrencyPool({ concurrency: 2.7 })).toThrow(
        "Concurrency must be an integer"
      );
    });

    it("should handle worker errors", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 2 });
      const items = [1, 2, 3];
      const worker = vi
        .fn()
        .mockImplementationOnce(async (item: number) => item * 2)
        .mockRejectedValueOnce(new Error("Worker error"))
        .mockImplementationOnce(async (item: number) => item * 2);

      await expect(runWithPool(items, worker)).rejects.toThrow("Worker error");
    });

    it("should handle async worker functions", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 2 });
      const items = [1, 2, 3];
      const worker = vi.fn().mockImplementation(async (item: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return item * 2;
      });

      const startTime = Date.now();
      const results = await runWithPool(items, worker);
      const endTime = Date.now();

      expect(results).toEqual([2, 4, 6]);
      expect(worker).toHaveBeenCalledTimes(3);
      // Should take less than 50ms (3 items * 10ms each) due to concurrency
      // Allow some buffer for test execution overhead
      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should handle different return types", async () => {
      const runWithPool = createConcurrencyPool({ concurrency: 2 });
      const items = ["hello", "world"];
      const worker = vi.fn().mockImplementation(async (item: string) => ({
        input: item,
        length: item.length,
        upper: item.toUpperCase(),
      }));

      const results = await runWithPool(items, worker);

      expect(results).toEqual([
        { input: "hello", length: 5, upper: "HELLO" },
        { input: "world", length: 5, upper: "WORLD" },
      ]);
    });
  });
});
