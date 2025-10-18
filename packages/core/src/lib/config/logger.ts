/**
 * @fileoverview Configuration logging utilities
 */

import type { VisualTestingToolConfig } from "@visnap/protocol";

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_COMPARISON_CORE,
  DEFAULT_THRESHOLD,
} from "@/constants";
import { log } from "@/utils/logger";

/**
 * Logs the effective configuration to the console.
 * @param config - The configuration to log
 */
export const logEffectiveConfig = (config: VisualTestingToolConfig): void => {
  // Use dynamic import to avoid circular dependency
  log.info("Effective configuration:");
  log.dim(`  Screenshot directory: ${config.screenshotDir}`);
  log.dim(
    `  Comparison core: ${config.comparison?.core ?? DEFAULT_COMPARISON_CORE}`
  );
  log.dim(
    `  Comparison threshold: ${config.comparison?.threshold ?? DEFAULT_THRESHOLD}`
  );
  log.dim(
    `  Max concurrency: ${config.runtime?.maxConcurrency ?? DEFAULT_CONCURRENCY}`
  );
  log.dim(`  Browser adapter: ${config.adapters.browser.name}`);
  log.dim(`  Test case adapter: ${config.adapters.testCase[0]?.name}`);
  if (config.viewport) {
    const viewportKeys = Object.keys(config.viewport);
    log.dim(
      `  Global viewports: ${viewportKeys.length} configured (${viewportKeys.join(", ")})`
    );
  }
};
