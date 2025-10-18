/**
 * @fileoverview Comparison domain exports
 *
 * Provides image comparison engines, utilities, and related functionality
 * for visual testing operations.
 */

export { compareTestCases } from "./compare";
export type { CompareOptions, CompareResult } from "./compare";
export {
  comparisonEngineRegistry,
  registerBuiltInEngines,
} from "./comparison-engine-registry";
