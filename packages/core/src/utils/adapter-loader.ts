import type {
  BrowserAdapter,
  TestCaseAdapter,
  VisualTestingToolConfig,
  BrowserName,
} from "@vividiff/protocol";

/**
 * Load a browser adapter dynamically based on configuration
 */
export async function loadBrowserAdapter(
  adapters: VisualTestingToolConfig["adapters"]
): Promise<BrowserAdapter> {
  const moduleName = adapters?.browser?.name;
  if (!moduleName) throw new Error("Browser adapter is required");
  const browserAdapterOptions = adapters?.browser?.options as
    | Record<string, unknown>
    | undefined;

  const mod = await import(moduleName);
  if (typeof (mod as any)?.createAdapter === "function") {
    return (mod as any).createAdapter(browserAdapterOptions);
  }

  throw new Error(
    `Browser adapter ${moduleName} must export createAdapter function`
  );
}

/**
 * Load a test case adapter dynamically based on configuration
 * @deprecated Use loadAllTestCaseAdapters for multiple adapter support
 */
export async function loadTestCaseAdapter(
  adapters: VisualTestingToolConfig["adapters"]
): Promise<TestCaseAdapter> {
  const first = adapters?.testCase?.[0];
  const moduleName = first?.name;
  const adapterOptions = first?.options as Record<string, unknown> | undefined;
  if (!moduleName) throw new Error("Test case adapter is required");

  const mod = await import(moduleName);
  if (typeof (mod as any)?.createAdapter === "function") {
    return (mod as any).createAdapter(adapterOptions);
  }

  throw new Error(
    `Test case adapter ${moduleName} must export createAdapter function`
  );
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
  for (const adapterConfig of testCaseAdapters) {
    const mod = await import(adapterConfig.name);
    if (typeof mod?.createAdapter === "function") {
      loaded.push(mod.createAdapter(adapterConfig.options));
    } else {
      throw new Error(`${adapterConfig.name} must export createAdapter`);
    }
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
          console.warn(`Error disposing browser adapter: ${error}`);
        }
      }
    );
    await Promise.all(disposePromises);
    this.adapters.clear();
  }
}
