/**
 * @fileoverview Browser domain exports
 *
 * Provides browser adapter loading, configuration, and management utilities
 * for visual testing operations.
 */

export { loadBrowserAdapter, BrowserAdapterPool } from "./adapter-loader";
export { parseBrowsersFromConfig } from "./browser-config";
export type { BrowserTarget } from "./browser-config";
