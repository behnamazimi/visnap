import { describe, it, expect, vi } from "vitest";

import { withTimeout } from "./utils";

describe("utils", () => {
  describe("withTimeout", () => {
    it("should resolve with the promise result when promise resolves within timeout", async () => {
      const promise = Promise.resolve("success");
      const result = await withTimeout(promise, 1000, "timeout");
      expect(result).toBe("success");
    });

    it("should reject with timeout error when promise takes too long", async () => {
      const promise = new Promise(resolve =>
        setTimeout(() => resolve("delayed"), 200)
      );
      await expect(withTimeout(promise, 100, "timeout")).rejects.toThrow(
        "timeout"
      );
    });

    it("should reject with original error when promise rejects", async () => {
      const promise = Promise.reject(new Error("original error"));
      await expect(withTimeout(promise, 1000, "timeout")).rejects.toThrow(
        "original error"
      );
    });

    it("should clear timeout when promise resolves", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const promise = Promise.resolve("success");
      await withTimeout(promise, 1000, "timeout");
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("should clear timeout when promise rejects", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const promise = Promise.reject(new Error("error"));
      try {
        await withTimeout(promise, 1000, "timeout");
      } catch {
        // Expected to throw
      }
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
