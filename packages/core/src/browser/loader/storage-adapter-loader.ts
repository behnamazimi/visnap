/**
 * @fileoverview Storage adapter loading utilities
 */

import { FsStorageAdapter } from "@visnap/fs-adapter";
import type { VisualTestingToolConfig, StorageAdapter } from "@visnap/protocol";

import { DEFAULT_SCREENSHOT_DIR } from "@/constants";

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
