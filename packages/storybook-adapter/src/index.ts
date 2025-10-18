/**
 * @fileoverview Storybook adapter for Visnap visual testing framework
 *
 * Storybook-based TestCaseAdapter that can discover and test Storybook stories.
 * Manages a local Storybook server, discovers stories from the browser context,
 * and normalizes them into test case instances.
 */

import type {
  TestCaseAdapter,
  TestCaseInstanceMeta,
  ViewportMap,
  PageWithEvaluate,
} from "@visnap/protocol";

import { discoverCasesFromBrowser } from "./discovery";
import { normalizeStories } from "./filtering";
import { createServerManager } from "./server";
import { validateOptions } from "./validation";

/**
 * Options to create a Storybook adapter
 * @property source - Either a URL to a running Storybook or a path to a `storybook-static` directory
 * @property port - If serving from disk, which port to bind to (defaults to 4477)
 * @property include - Optional minimatch pattern(s) matched against story IDs
 * @property exclude - Optional minimatch pattern(s) to exclude from story IDs
 * @property discovery - Configuration for story discovery timeouts and retries
 */
export interface CreateStorybookAdapterOptions {
  source: string;
  port?: number;
  include?: string | string[];
  exclude?: string | string[];
  discovery?: {
    evalTimeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
  };
}

/**
 * Creates a Storybook-based TestCaseAdapter that can:
 * - Start a local static file server for `storybook-static` or use a provided URL
 * - Discover stories via the browser by calling Storybook's `extract()` API
 * - Filter, normalize, and expand stories into test case instances
 *
 * @param options - Configuration options for the Storybook adapter
 * @returns A TestCaseAdapter instance configured for Storybook testing
 */
export function createAdapter(
  options: CreateStorybookAdapterOptions
): TestCaseAdapter {
  // Validate options using ArkType schema
  const validatedOptions = validateOptions(options);

  const serverManager = createServerManager(
    validatedOptions.source,
    validatedOptions.port
  );

  return {
    name: "storybook",
    /**
     * Starts the adapter and returns base URL of the Storybook under test
     * @returns Promise resolving to adapter start result with base URL and initial page URL
     */
    async start() {
      await serverManager.ensureStarted();
      const baseUrl = serverManager.getBaseUrl();
      return {
        baseUrl,
        initialPageUrl: `${baseUrl}/iframe.html`,
      };
    },

    /**
     * Lists normalized and filtered stories from the current page context
     * Requires a page context capable of `evaluate`. Automatically closes the page context afterwards.
     *
     * @param pageCtx - Page context required for story discovery
     * @param o - Options including viewport configuration
     * @returns Promise resolving to array of test case instances
     * @throws {Error} If page context is not provided or adapter not started
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
        cases = await discoverCasesFromBrowser(
          pageCtx,
          validatedOptions.discovery
        );
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
        include: validatedOptions?.include,
        exclude: validatedOptions?.exclude,
        baseUrl,
        viewportKeys: keys,
        globalViewport: o?.viewport,
      });
    },
    /**
     * Stops the adapter server (if any) and clears base URL
     * Safe to call multiple times
     * @returns Promise resolving when server is stopped
     */
    async stop() {
      await serverManager.stop();
    },
  };
}
