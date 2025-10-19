import { describe, it, expect, vi, beforeEach } from "vitest";

import { BrowserAdapterPool } from "./browser-pool";

import { createMockBrowserAdapter } from "@/__mocks__/mock-adapters";

describe("browser-pool", () => {
  let pool: BrowserAdapterPool;
  let mockLoadBrowserAdapter: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pool = new BrowserAdapterPool();
    mockLoadBrowserAdapter = vi.fn();
  });

  describe("BrowserAdapterPool", () => {
    describe("getAdapter", () => {
      it("should create and return adapter for new browser", async () => {
        const mockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(result).toBe(mockAdapter);
        expect(mockLoadBrowserAdapter).toHaveBeenCalledTimes(1);
        expect(mockAdapter.init).toHaveBeenCalledWith({
          browser: "chromium",
        });
      });

      it("should create adapter with browser options", async () => {
        const mockAdapter = createMockBrowserAdapter();
        const browserOptions = { headless: true, args: ["--no-sandbox"] };
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          browserOptions,
          mockLoadBrowserAdapter
        );

        expect(result).toBe(mockAdapter);
        expect(mockAdapter.init).toHaveBeenCalledWith({
          browser: "chromium",
          options: browserOptions,
        });
      });

      it("should return existing adapter for same browser", async () => {
        const mockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        // First call
        const result1 = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );
        // Second call
        const result2 = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(result1).toBe(result2);
        expect(mockLoadBrowserAdapter).toHaveBeenCalledTimes(1);
        expect(mockAdapter.init).toHaveBeenCalledTimes(1);
      });

      it("should create separate adapters for different browsers", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        mockLoadBrowserAdapter
          .mockResolvedValueOnce(mockAdapter1)
          .mockResolvedValueOnce(mockAdapter2);

        const result1 = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );
        const result2 = await pool.getAdapter(
          "firefox",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(result1).toBe(mockAdapter1);
        expect(result2).toBe(mockAdapter2);
        expect(mockLoadBrowserAdapter).toHaveBeenCalledTimes(2);
        expect(mockAdapter1.init).toHaveBeenCalledWith({ browser: "chromium" });
        expect(mockAdapter2.init).toHaveBeenCalledWith({ browser: "firefox" });
      });

      it("should handle adapter creation errors", async () => {
        const error = new Error("Failed to create adapter");
        mockLoadBrowserAdapter.mockRejectedValue(error);

        await expect(
          pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter)
        ).rejects.toThrow("Failed to create adapter");
      });

      it("should handle adapter initialization errors", async () => {
        const mockAdapter = createMockBrowserAdapter();
        const error = new Error("Failed to initialize adapter");
        (mockAdapter.init as any).mockRejectedValue(error);
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        await expect(
          pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter)
        ).rejects.toThrow("Failed to initialize adapter");
      });

      it("should handle multiple browsers with same options", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        const browserOptions = { headless: true };
        mockLoadBrowserAdapter
          .mockResolvedValueOnce(mockAdapter1)
          .mockResolvedValueOnce(mockAdapter2);

        const result1 = await pool.getAdapter(
          "chromium",
          browserOptions,
          mockLoadBrowserAdapter
        );
        const result2 = await pool.getAdapter(
          "firefox",
          browserOptions,
          mockLoadBrowserAdapter
        );

        expect(result1).toBe(mockAdapter1);
        expect(result2).toBe(mockAdapter2);
        expect(mockAdapter1.init).toHaveBeenCalledWith({
          browser: "chromium",
          options: browserOptions,
        });
        expect(mockAdapter2.init).toHaveBeenCalledWith({
          browser: "firefox",
          options: browserOptions,
        });
      });
    });

    describe("disposeAll", () => {
      it("should dispose all adapters", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        mockLoadBrowserAdapter
          .mockResolvedValueOnce(mockAdapter1)
          .mockResolvedValueOnce(mockAdapter2);

        // Create adapters
        await pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter);
        await pool.getAdapter("firefox", undefined, mockLoadBrowserAdapter);

        // Dispose all
        await pool.disposeAll();

        expect(mockAdapter1.dispose).toHaveBeenCalledTimes(1);
        expect(mockAdapter2.dispose).toHaveBeenCalledTimes(1);
      });

      it("should clear adapters after disposal", async () => {
        const mockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        await pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter);
        await pool.disposeAll();

        // Should create new adapter on next call
        const newMockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(newMockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(result).toBe(newMockAdapter);
        expect(mockLoadBrowserAdapter).toHaveBeenCalledTimes(2);
      });

      it("should handle disposal errors gracefully", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        const error = new Error("Disposal failed");
        (mockAdapter1.dispose as any).mockRejectedValue(error);
        mockLoadBrowserAdapter
          .mockResolvedValueOnce(mockAdapter1)
          .mockResolvedValueOnce(mockAdapter2);

        await pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter);
        await pool.getAdapter("firefox", undefined, mockLoadBrowserAdapter);

        // Should not throw even if one adapter fails
        await expect(pool.disposeAll()).resolves.toBeUndefined();

        expect(mockAdapter1.dispose).toHaveBeenCalledTimes(1);
        expect(mockAdapter2.dispose).toHaveBeenCalledTimes(1);
      });

      it("should handle empty pool", async () => {
        await expect(pool.disposeAll()).resolves.toBeUndefined();
      });

      it("should handle multiple disposal calls", async () => {
        const mockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        await pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter);
        await pool.disposeAll();
        await pool.disposeAll(); // Second call

        expect(mockAdapter.dispose).toHaveBeenCalledTimes(1);
      });
    });

    describe("integration", () => {
      it("should handle complex workflow", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        mockLoadBrowserAdapter
          .mockResolvedValueOnce(mockAdapter1)
          .mockResolvedValueOnce(mockAdapter2);

        // Get adapters
        const chromiumAdapter = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );
        const firefoxAdapter = await pool.getAdapter(
          "firefox",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(chromiumAdapter).toBe(mockAdapter1);
        expect(firefoxAdapter).toBe(mockAdapter2);

        // Get same adapters again
        const chromiumAdapter2 = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );
        const firefoxAdapter2 = await pool.getAdapter(
          "firefox",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(chromiumAdapter2).toBe(chromiumAdapter);
        expect(firefoxAdapter2).toBe(firefoxAdapter);

        // Dispose all
        await pool.disposeAll();

        expect(mockAdapter1.dispose).toHaveBeenCalledTimes(1);
        expect(mockAdapter2.dispose).toHaveBeenCalledTimes(1);
      });

      it("should handle adapter reuse after disposal", async () => {
        const mockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(mockAdapter);

        // First use
        await pool.getAdapter("chromium", undefined, mockLoadBrowserAdapter);
        await pool.disposeAll();

        // Second use - should create new adapter
        const newMockAdapter = createMockBrowserAdapter();
        mockLoadBrowserAdapter.mockResolvedValue(newMockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          undefined,
          mockLoadBrowserAdapter
        );

        expect(result).toBe(newMockAdapter);
        expect(mockLoadBrowserAdapter).toHaveBeenCalledTimes(2);
      });
    });
  });
});
