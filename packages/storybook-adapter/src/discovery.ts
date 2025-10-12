import type { PageWithEvaluate } from "@vividiff/protocol";

import { withTimeout } from "./utils.js";

/**
 * Story discovery for Storybook adapter
 */

// Default configuration values
const DEFAULT_EVAL_TIMEOUT_MS = 15000;
const DEFAULT_DISCOVERY_MAX_RETRIES = 3;
const DEFAULT_DISCOVERY_RETRY_DELAY_MS = 500;

export interface DiscoveryConfig {
  evalTimeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Discovers Storybook cases in the current browser page by evaluating inside the page context.
 * Requires a `PageWithEvaluate` that can execute code in the browser and optionally be closed later.
 * Applies a timeout for resiliency and validates the Storybook globals.
 */
export async function discoverCasesFromBrowser(
  pageCtx: PageWithEvaluate,
  config: DiscoveryConfig = {}
): Promise<Record<string, unknown>> {
  if (!("evaluate" in pageCtx) || typeof pageCtx.evaluate !== "function") {
    throw new Error("Page context does not support evaluate()");
  }

  // Use configuration values with defaults
  const evalTimeoutMs = config.evalTimeoutMs ?? DEFAULT_EVAL_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? DEFAULT_DISCOVERY_MAX_RETRIES;
  const retryDelayMs = config.retryDelayMs ?? DEFAULT_DISCOVERY_RETRY_DELAY_MS;

  const attempt = async (): Promise<Record<string, unknown>> => {
    const evalPromise = (
      pageCtx.evaluate as NonNullable<PageWithEvaluate["evaluate"]>
    )(async () => {
      const storybook = window.__STORYBOOK_PREVIEW__;
      if (!storybook) {
        throw new Error("Storybook preview object not found on window");
      }
      if (typeof storybook.ready === "function") {
        await storybook.ready();
      }
      if (typeof storybook.extract !== "function") {
        throw new Error("Storybook extract() is unavailable");
      }
      return await storybook.extract();
    });

    return (await withTimeout(
      evalPromise,
      evalTimeoutMs,
      "Story discovery timed out"
    )) as Record<string, unknown>;
  };

  let lastError: unknown;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await attempt();
    } catch (e) {
      lastError = e;
      if (i < maxRetries - 1) {
        await new Promise(res => setTimeout(res, retryDelayMs * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Story discovery failed");
}
