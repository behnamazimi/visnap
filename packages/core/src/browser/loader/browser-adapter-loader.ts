/**
 * @fileoverview Browser adapter loading utilities
 */

import { createRequire } from "module";

import type { BrowserAdapter, VisualTestingToolConfig } from "@visnap/protocol";

import log from "@/utils/logger";

/**
 * Resolves and imports adapter module with environment-agnostic strategy.
 * Always prioritizes local project installation over global installations.
 * @param adapterName - Name of the adapter to resolve
 * @returns Promise resolving to the imported module
 */
async function resolveAndImportAdapter(adapterName: string): Promise<any> {
  // Strategy 1: Try to resolve from project's node_modules (local installation)
  // This should work in all environments when packages are properly installed locally
  try {
    const projectRequire = createRequire(process.cwd() + "/package.json");
    const modulePath = projectRequire.resolve(adapterName);
    return await import(modulePath);
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Try to resolve from current working directory
  try {
    const projectRequire = createRequire(process.cwd() + "/package.json");
    const modulePath = projectRequire.resolve(adapterName, {
      paths: [process.cwd()],
    });
    return await import(modulePath);
  } catch {
    // Continue to next strategy
  }

  // Strategy 3: Fall back to direct import (let Node.js handle resolution)
  return await import(adapterName);
}

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
    return `${baseMessage}. Please ensure the adapter is installed locally in your project: npm install -D ${moduleName}. You can also run 'npx visnap init' to set up all required packages automatically.`;
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
    // Use improved adapter resolution and import strategy
    log.debug(`Loading browser adapter '${moduleName}'...`);

    const mod = await resolveAndImportAdapter(moduleName);

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
