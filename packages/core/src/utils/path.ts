import { dirname } from "path";
import { fileURLToPath } from "url";

/**
 * ESM-compatible __dirname replacement
 * Tries to use import.meta.url, falls back to process.cwd() if not available
 */
export function getCurrentDirectory(): string {
  try {
    return dirname(fileURLToPath(import.meta.url));
  } catch {
    // Fallback for environments that don't support import.meta.url
    return process.cwd();
  }
}
