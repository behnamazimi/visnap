/**
 * @fileoverview Browser adapter pool for managing multiple browser instances
 */

import type { BrowserAdapter, BrowserName } from "@visnap/protocol";

import log from "@/utils/logger";

/**
 * Browser adapter pool for managing multiple browser instances.
 */
export class BrowserAdapterPool {
  private adapters = new Map<BrowserName, BrowserAdapter>();

  /**
   * Gets or creates a browser adapter for the specified browser.
   * @param browserName - Name of the browser to get adapter for
   * @param browserOptions - Browser-specific options
   * @param loadBrowserAdapter - Function to load the browser adapter
   * @returns Promise resolving to the browser adapter
   */
  async getAdapter(
    browserName: BrowserName,
    browserOptions: Record<string, unknown> | undefined,
    loadBrowserAdapter: () => Promise<BrowserAdapter>
  ): Promise<BrowserAdapter> {
    if (!this.adapters.has(browserName)) {
      const adapter = await loadBrowserAdapter();
      await adapter.init({
        browser: browserName,
        ...(browserOptions && { options: browserOptions }),
      });
      this.adapters.set(browserName, adapter);
    }
    return this.adapters.get(browserName)!;
  }

  /**
   * Disposes all browser adapters in the pool.
   * @returns Promise that resolves when all adapters are disposed
   */
  async disposeAll(): Promise<void> {
    const disposePromises = Array.from(this.adapters.values()).map(
      async adapter => {
        try {
          await adapter.dispose();
        } catch (error) {
          // Log error but don't throw to ensure cleanup continues
          log.warn(`Error disposing browser adapter: ${error}`);
        }
      }
    );
    await Promise.all(disposePromises);
    this.adapters.clear();
  }
}
