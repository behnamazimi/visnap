import type { BrowserAdapter } from "@visnap/protocol";
import { describe, it, expect, beforeEach } from "vitest";

import { BrowserAdapterPool } from "./browser-pool";

import { createMockBrowserAdapter } from "@/__mocks__/mock-adapters";

describe("browser-pool", () => {
  let pool: BrowserAdapterPool;
  let loadAdapterCalls: number;
  let adapterQueue: Array<BrowserAdapter | Error>;
  const loadAdapterImpl = async (): Promise<BrowserAdapter> => {
    const item = adapterQueue.length ? adapterQueue.shift()! : undefined;
    if (item instanceof Error) throw item;
    if (!item) throw new Error("No adapter queued");
    return item as BrowserAdapter;
  };

  beforeEach(() => {
    pool = new BrowserAdapterPool();
    adapterQueue = [];
    loadAdapterCalls = 0;
  });

  describe("BrowserAdapterPool", () => {
    describe("getAdapter", () => {
      it("should create and return adapter for new browser", async () => {
        const mockAdapter = createMockBrowserAdapter();
        adapterQueue.push(mockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(result).toBe(mockAdapter);
        expect(loadAdapterCalls).toBe(1);
        expect(mockAdapter.init).toHaveBeenCalledWith({
          browser: "chromium",
        });
      });

      it("should create adapter with browser options", async () => {
        const mockAdapter = createMockBrowserAdapter();
        const browserOptions = { headless: true, args: ["--no-sandbox"] };
        adapterQueue.push(mockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          browserOptions,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(result).toBe(mockAdapter);
        expect(mockAdapter.init).toHaveBeenCalledWith({
          browser: "chromium",
          options: browserOptions,
        });
      });

      it("should return existing adapter for same browser", async () => {
        const mockAdapter = createMockBrowserAdapter();
        adapterQueue.push(mockAdapter, mockAdapter);

        // First call
        const result1 = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );
        // Second call
        const result2 = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(result1).toBe(result2);
        expect(loadAdapterCalls).toBe(1);
        expect(mockAdapter.init).toHaveBeenCalledTimes(1);
      });

      it("should create separate adapters for different browsers", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        adapterQueue.push(mockAdapter1, mockAdapter2);

        const result1 = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );
        const result2 = await pool.getAdapter(
          "firefox",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(result1).toBe(mockAdapter1);
        expect(result2).toBe(mockAdapter2);
        expect(loadAdapterCalls).toBe(2);
        expect(mockAdapter1.init).toHaveBeenCalledWith({ browser: "chromium" });
        expect(mockAdapter2.init).toHaveBeenCalledWith({ browser: "firefox" });
      });

      it("should handle adapter creation errors", async () => {
        const error = new Error("Failed to create adapter");
        adapterQueue.push(error);

        await expect(
          pool.getAdapter("chromium", undefined, async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          })
        ).rejects.toThrow("Failed to create adapter");
      });

      it("should handle adapter initialization errors", async () => {
        const mockAdapter = createMockBrowserAdapter();
        const error = new Error("Failed to initialize adapter");
        (mockAdapter.init as any).mockRejectedValue(error);
        adapterQueue.push(mockAdapter);

        await expect(
          pool.getAdapter("chromium", undefined, async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          })
        ).rejects.toThrow("Failed to initialize adapter");
      });

      it("should handle multiple browsers with same options", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        const browserOptions = { headless: true };
        adapterQueue.push(mockAdapter1, mockAdapter2);

        const result1 = await pool.getAdapter(
          "chromium",
          browserOptions,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );
        const result2 = await pool.getAdapter(
          "firefox",
          browserOptions,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
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

        // Create adapters
        adapterQueue.push(mockAdapter1, mockAdapter2);
        await pool.getAdapter("chromium", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });
        await pool.getAdapter("firefox", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });

        // Dispose all
        await pool.disposeAll();

        expect(mockAdapter1.dispose).toHaveBeenCalledTimes(1);
        expect(mockAdapter2.dispose).toHaveBeenCalledTimes(1);
      });

      it("should clear adapters after disposal", async () => {
        const mockAdapter = createMockBrowserAdapter();
        adapterQueue.push(mockAdapter);

        await pool.getAdapter("chromium", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });
        await pool.disposeAll();

        // Should create new adapter on next call
        const newMockAdapter = createMockBrowserAdapter();
        adapterQueue.push(newMockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(result).toBe(newMockAdapter);
        expect(loadAdapterCalls).toBe(2);
      });

      it("should handle disposal errors gracefully", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        const error = new Error("Disposal failed");
        (mockAdapter1.dispose as any).mockRejectedValue(error);
        adapterQueue.push(mockAdapter1, mockAdapter2);

        await pool.getAdapter("chromium", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });
        await pool.getAdapter("firefox", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });

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
        adapterQueue.push(mockAdapter);

        await pool.getAdapter("chromium", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });
        await pool.disposeAll();
        await pool.disposeAll(); // Second call

        expect(mockAdapter.dispose).toHaveBeenCalledTimes(1);
      });
    });

    describe("integration", () => {
      it("should handle complex workflow", async () => {
        const mockAdapter1 = createMockBrowserAdapter();
        const mockAdapter2 = createMockBrowserAdapter();
        adapterQueue.push(mockAdapter1, mockAdapter2);

        // Get adapters
        const chromiumAdapter = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );
        const firefoxAdapter = await pool.getAdapter(
          "firefox",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(chromiumAdapter).toBe(mockAdapter1);
        expect(firefoxAdapter).toBe(mockAdapter2);

        // Get same adapters again
        const chromiumAdapter2 = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );
        const firefoxAdapter2 = await pool.getAdapter(
          "firefox",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
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
        adapterQueue.push(mockAdapter);

        // First use
        await pool.getAdapter("chromium", undefined, async () => {
          loadAdapterCalls++;
          return loadAdapterImpl();
        });
        await pool.disposeAll();

        // Second use - should create new adapter
        const newMockAdapter = createMockBrowserAdapter();
        adapterQueue.push(newMockAdapter);

        const result = await pool.getAdapter(
          "chromium",
          undefined,
          async () => {
            loadAdapterCalls++;
            return loadAdapterImpl();
          }
        );

        expect(result).toBe(newMockAdapter);
        expect(loadAdapterCalls).toBe(2);
      });
    });
  });
});
