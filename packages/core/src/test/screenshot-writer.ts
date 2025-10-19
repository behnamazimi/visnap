import { unlink } from "fs/promises";

import type { StorageAdapter, StorageKind } from "@visnap/protocol";
import { SNAPSHOT_EXTENSION } from "@visnap/protocol";

import log from "@/utils/logger";

/**
 * Write screenshot buffer to file using storage adapter
 * Uses direct write approach for better performance and simplicity
 */
export async function writeScreenshotToFile(
  buffer: Uint8Array,
  storage: StorageAdapter,
  id: string,
  kind: StorageKind = "current"
): Promise<string> {
  // Sanitize ID for security
  const safeId = id.replace(/[^a-zA-Z0-9\-_]/g, "_");
  const filename = `${safeId}${SNAPSHOT_EXTENSION}`;

  try {
    const path = await storage.write(kind, filename, buffer);
    return path;
  } catch (error) {
    throw new Error(`Failed to write screenshot file: ${error}`);
  }
}

/**
 * Clean up temporary files
 * Note: This function does not mutate the input array
 */
export async function cleanupTempFiles(tempFiles: string[]): Promise<void> {
  const cleanupPromises = tempFiles.map(async file => {
    try {
      await unlink(file);
    } catch (error) {
      // Ignore errors during cleanup - file might not exist
      log.dim(`Failed to cleanup temp file ${file}: ${error}`);
    }
  });

  await Promise.all(cleanupPromises);
  // Note: Input array is not mutated - caller should clear it if needed
}
