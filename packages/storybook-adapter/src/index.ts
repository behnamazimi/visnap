import type {
  TestCaseAdapter,
  TestCaseInstanceMeta,
  ViewportMap,
  PageWithEvaluate,
} from "@vividiff/protocol";

import { discoverCasesFromBrowser } from "./discovery.js";
import { normalizeStories } from "./filtering.js";
import { createServerManager } from "./server.js";

/**
 * Options to create a Storybook adapter.
 * - `source`: Either a URL to a running Storybook or a path to a `storybook-static` directory.
 * - `port`: If serving from disk, which port to bind to (defaults to 4477).
 * - `include`/`exclude`: Optional minimatch pattern (supports `*`) matched against story IDs.
 */
export interface CreateStorybookAdapterOptions {
  source: string;
  port?: number;
  include?: string | string[];
  exclude?: string | string[];
}

/**
 * Creates a Storybook-based TestCaseAdapter that can:
 * - Start a local static file server for `storybook-static` or use a provided URL.
 * - Discover stories via the browser by calling Storybook's `extract()` API.
 * - Filter, normalize, and expand stories into test case instances.
 *
 * The returned API shape matches `TestCaseAdapter` and is preserved.
 */
export function createAdapter(
  opts: CreateStorybookAdapterOptions
): TestCaseAdapter {
  if (
    !opts ||
    typeof opts.source !== "string" ||
    opts.source.trim().length === 0
  ) {
    throw new Error("Invalid 'source' provided to createAdapter");
  }

  const serverManager = createServerManager(opts.source, opts.port);

  return {
    name: "storybook",
    /** Starts the adapter and returns `{ baseUrl }` of the Storybook under test. */
    async start() {
      await serverManager.ensureStarted();
      const baseUrl = serverManager.getBaseUrl();
      return {
        baseUrl,
        initialPageUrl: `${baseUrl}/iframe.html`,
      };
    },

    /**
     * Lists normalized and filtered stories from the current page context.
     * Requires a page context capable of `evaluate`. Automatically closes the page context afterwards.
     */
    async listCases(
      pageCtx?: PageWithEvaluate,
      o?: { viewport?: ViewportMap }
    ): Promise<TestCaseInstanceMeta[]> {
      if (!pageCtx) {
        throw new Error("Page context is required for storybook adapter");
      }

      let cases: Record<string, unknown>;
      try {
        cases = await discoverCasesFromBrowser(pageCtx);
      } finally {
        await pageCtx?.close?.();
      }

      const baseUrl = serverManager.getBaseUrl();
      if (!baseUrl) {
        throw new Error(
          "Adapter not started. Call start() before listCases()."
        );
      }

      let keys = o?.viewport ? Object.keys(o.viewport) : ["default"];
      if (!keys || keys.length === 0) keys = ["default"];
      // Sort viewport keys deterministically
      keys.sort((a, b) => a.localeCompare(b));

      return normalizeStories(cases, {
        include: opts?.include,
        exclude: opts?.exclude,
        baseUrl,
        viewportKeys: keys,
        globalViewport: o?.viewport,
      });
    },
    /** Stops the adapter server (if any) and clears `baseUrl`. Safe to call multiple times. */
    async stop() {
      await serverManager.stop();
    },
  };
}
