/**
 * @fileoverview Comparison utilities
 */

import type { ComparisonCore, ComparisonEngine } from "@visnap/protocol";

import { OdiffEngine, PixelmatchEngine } from "./engines";

/**
 * Creates a comparison engine instance based on the specified core.
 * @param core - The comparison core to use
 * @returns Comparison engine instance
 * @throws {Error} If the comparison core is not supported
 */
export function createComparisonEngine(core: ComparisonCore): ComparisonEngine {
  switch (core) {
    case "odiff":
      return new OdiffEngine();
    case "pixelmatch":
      return new PixelmatchEngine();
    default:
      throw new Error(`Unsupported comparison core: ${core}`);
  }
}
