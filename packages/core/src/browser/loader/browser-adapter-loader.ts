/**
 * @fileoverview Browser adapter loading utilities
 */

import type { BrowserAdapter, VisualTestingToolConfig } from "@visnap/protocol";

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

