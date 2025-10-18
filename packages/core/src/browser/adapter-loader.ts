/**
 * @fileoverview Adapter loading utilities
 *
 * Dynamically loads browser adapters, test case adapters, and storage adapters
 * based on configuration. Includes error handling and adapter pooling.
 */

import { FsStorageAdapter } from "@visnap/fs-adapter";
import type {
  BrowserAdapter,
  TestCaseAdapter,
  VisualTestingToolConfig,
  BrowserName,
  StorageAdapter,
} from "@visnap/protocol";

import { DEFAULT_SCREENSHOT_DIR } from "@/constants";
import log from "@/utils/logger";

/**
 * Formats error messages for adapter loading failures.
 * @param moduleName - Name of the adapter module
 * @param errorType - Type of adapter (browser, test case, etc.)
 * @param errorMessage - Original error message
 * @returns Formatted error message with helpful suggestions
 */
function formatAdapterError(
  moduleName: string,
  errorType: string,
  errorMessage: string
): string {
  const baseMessage = `Failed to load ${errorType} adapter ${moduleName}`;

  if (
    errorMessage.includes("Cannot resolve module") ||
    errorMessage.includes("Module not found")
  ) {
    return `${baseMessage}. Please ensure the adapter is installed: npm install ${moduleName}`;
  }

  return `${baseMessage}: ${errorMessage}. Please verify the adapter is properly installed and exports a createAdapter function.`;
}

/**
 * Loads a browser adapter dynamically based on configuration.
 * @param adapters - Adapter configuration from the visual testing tool config
 * @returns Promise resolving to initialized browser adapter
 * @throws {Error} If adapter loading fails or required configuration is missing
 */
export async function loadBrowserAdapter(
  adapters: VisualTestingToolConfig["adapters"]
): Promise<BrowserAdapter> {
  const moduleName = adapters?.browser?.name;
  if (!moduleName) {
    throw new Error("Browser adapter is required");
  }

  const browserAdapterOptions = adapters?.browser?.options as
    | Record<string, unknown>
    | undefined;

  try {
    const mod = await import(moduleName);

    // Check if the module exports createAdapter function
    if (typeof mod?.createAdapter !== "function") {
      throw new Error(
        `Browser adapter ${moduleName} must export createAdapter function. ` +
          `Found exports: ${Object.keys(mod).join(", ")}`
      );
    }

    return mod.createAdapter(browserAdapterOptions);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(formatAdapterError(moduleName, "browser", errorMessage));
  }
}

/**
 * Loads all test case adapters dynamically based on configuration.
 * @param adapters - Adapter configuration from the visual testing tool config
 * @returns Promise resolving to array of initialized test case adapters
 * @throws {Error} If no adapters can be loaded successfully
 */
export async function loadAllTestCaseAdapters(
  adapters: VisualTestingToolConfig["adapters"]
): Promise<TestCaseAdapter[]> {
  const testCaseAdapters = adapters?.testCase ?? [];
  if (testCaseAdapters.length === 0) {
    throw new Error("At least one test case adapter is required");
  }

  const loaded: TestCaseAdapter[] = [];
  const errors: string[] = [];

  for (const adapterConfig of testCaseAdapters) {
    try {
      const mod = await import(adapterConfig.name);

      if (typeof mod?.createAdapter !== "function") {
        throw new Error(
          `Test case adapter ${adapterConfig.name} must export createAdapter function. ` +
            `Found exports: ${Object.keys(mod).join(", ")}`
        );
      }

      loaded.push(mod.createAdapter(adapterConfig.options));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Collect errors but continue loading other adapters
      errors.push(
        formatAdapterError(adapterConfig.name, "test case", errorMessage)
      );
    }
  }

  // If no adapters loaded successfully, throw error
  if (loaded.length === 0) {
    throw new Error(
      `Failed to load any test case adapters. Errors:\n${errors.join("\n")}`
    );
  }

  // If some adapters failed, warn but continue
  if (errors.length > 0) {
    log.warn(`Some test case adapters failed to load:\n${errors.join("\n")}`);
  }

  return loaded;
}

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

/**
 * Loads storage adapter based on configuration.
 * Currently only supports filesystem storage via FsStorageAdapter.
 * @param config - Visual testing tool configuration
 * @returns Promise resolving to initialized storage adapter
 */
export async function loadStorageAdapter(
  config: VisualTestingToolConfig
): Promise<StorageAdapter> {
  return new FsStorageAdapter({
    screenshotDir: config.screenshotDir ?? DEFAULT_SCREENSHOT_DIR,
  });
}
