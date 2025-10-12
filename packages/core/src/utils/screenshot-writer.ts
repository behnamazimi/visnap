import { writeFile, unlink } from "fs/promises";
import { join } from "path";

import log from "./logger";
import { validatePath } from "./path-validation";

/**
 * Write screenshot buffer to file with atomic operation
 * Uses direct write approach for better performance and simplicity
 */
export async function writeScreenshotToFile(
  buffer: Uint8Array,
  outDir: string,
  id: string
): Promise<string> {
  // Validate paths for security
  const safeId = id.replace(/[^a-zA-Z0-9\-_]/g, "_"); // Sanitize ID
  const finalPath = validatePath(join(outDir, `${safeId}.png`), outDir);

  try {
    await writeFile(finalPath, buffer);
  } catch (error) {
    throw new Error(`Failed to write screenshot file: ${error}`);
  }

  return finalPath;
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
