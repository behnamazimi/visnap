import { writeFile, unlink } from "fs/promises";
import { join } from "path";

import log from "./logger";

/**
 * Write screenshot buffer to file with atomic operation
 */
export async function writeScreenshotToFile(
  buffer: Uint8Array,
  outDir: string,
  id: string
): Promise<string> {
  const finalPath = join(outDir, `${id}.png`);
  const tmpPath = `${finalPath}.tmp`;

  await writeFile(tmpPath, buffer);
  await import("fs/promises")
    .then(m => m.rename(tmpPath, finalPath))
    .catch(async () => {
      await writeFile(finalPath, buffer);
    });

  return finalPath;
}

/**
 * Clean up temporary files
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
  tempFiles.length = 0; // Clear the array
}
