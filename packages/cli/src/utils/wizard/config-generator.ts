/**
 * @fileoverview Configuration generation utilities
 */

import { generateConfigContent as generateConfigContentTemplate } from "@visnap/core";

import type { AdapterSelection } from "./prompts";

/**
 * Generate configuration content from selection
 */
export function generateConfigFromSelection(
  selection: AdapterSelection
): string {
  // Use the shared template for basic config, then customize for wizard-specific options
  const baseConfig = generateConfigContentTemplate({
    configType: selection.configType,
    threshold: selection.threshold,
  });

  // For now, return the base config. In a more complex implementation,
  // we could parse and modify the generated config to include wizard-specific options
  return baseConfig;
}
