import type { PageWithEvaluate } from "@visual-testing-tool/protocol";

import { withTimeout } from "./utils.js";

/**
 * Story discovery for Storybook adapter
 */

const EVAL_TIMEOUT_MS = 15000;
const DISCOVERY_MAX_RETRIES = 3;
const DISCOVERY_RETRY_DELAY_MS = 500;

/**
 * Discovers Storybook cases in the current browser page by evaluating inside the page context.
 * Requires a `PageWithEvaluate` that can execute code in the browser and optionally be closed later.
 * Applies a timeout for resiliency and validates the Storybook globals.
 */
export async function discoverCasesFromBrowser(
  pageCtx: PageWithEvaluate
): Promise<Record<string, unknown>> {
  if (!("evaluate" in pageCtx) || typeof pageCtx.evaluate !== "function") {
    throw new Error("Page context does not support evaluate()");
  }

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
      EVAL_TIMEOUT_MS,
      "Story discovery timed out"
    )) as Record<string, unknown>;
  };

  let lastError: unknown;
  for (let i = 0; i < DISCOVERY_MAX_RETRIES; i++) {
    try {
      return await attempt();
    } catch (e) {
      lastError = e;
      if (i < DISCOVERY_MAX_RETRIES - 1) {
        await new Promise(res =>
          setTimeout(res, DISCOVERY_RETRY_DELAY_MS * (i + 1))
        );
        continue;
      }
      throw e;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Story discovery failed");
}
