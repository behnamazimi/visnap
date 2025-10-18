/**
 * @fileoverview Test case adapter loading utilities
 */

import type {
  TestCaseAdapter,
  VisualTestingToolConfig,
} from "@visnap/protocol";

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
