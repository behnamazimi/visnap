import type {
  BrowserAdapter,
  TestCaseAdapter,
  VisualTestingToolConfig,
  BrowserName,
} from "@vividiff/protocol";

import log from "./logger";

/**
 * Helper function to format consistent error messages for adapter loading
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
 * Load a browser adapter dynamically based on configuration
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
 * Load all test case adapters dynamically based on configuration
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
 * Browser adapter pool for managing multiple browser instances
 */
export class BrowserAdapterPool {
  private adapters = new Map<BrowserName, BrowserAdapter>();

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
