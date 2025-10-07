import http from "node:http";
import { existsSync } from "node:fs";

import type {
  TestCaseAdapter,
  TestCaseMeta,
  TestCaseInstanceMeta,
  ViewportMap,
  BrowserName,
  Viewport,
  PageWithEvaluate,
} from "@visual-testing-tool/protocol";

import handler from "serve-handler";

/**
 * Options to create a Storybook adapter.
 * - `source`: Either a URL to a running Storybook or a path to a `storybook-static` directory.
 * - `port`: If serving from disk, which port to bind to (defaults to 6006).
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
export function createStorybookAdapter(
  opts: CreateStorybookAdapterOptions
): TestCaseAdapter {
  if (
    !opts ||
    typeof opts.source !== "string" ||
    opts.source.trim().length === 0
  ) {
    throw new Error("Invalid 'source' provided to createStorybookAdapter");
  }

  let server: http.Server | null = null;
  let baseUrl: string | undefined;
  const isUrl = /^https?:\/\//i.test(opts.source ?? "");
  // No cache needed; we will use normalized story metadata directly

  const DEFAULT_PORT = 6006;
  const SERVER_START_TIMEOUT_MS = 10000;
  const EVAL_TIMEOUT_MS = 15000;
  const DISCOVERY_MAX_RETRIES = 3;
  const DISCOVERY_RETRY_DELAY_MS = 500;

  /** Races a promise against a timeout and ensures the timer is always cleared. */
  function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(message)), ms);
      promise.then(
        value => {
          clearTimeout(timer);
          resolve(value);
        },
        err => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  }

  /** Escapes a string for safe use inside a RegExp literal. */
  function escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Converts a user pattern supporting only `*` wildcards into a safe anchored RegExp.
   * Returns null if the pattern cannot produce a valid RegExp.
   */
  function toSafeRegex(pattern: string): RegExp | null {
    // Support '*' wildcards only; escape everything else
    const escaped = pattern
      .split("*")
      .map(segment => escapeRegExp(segment))
      .join(".*");
    try {
      return new RegExp(`^${escaped}$`);
    } catch {
      return null;
    }
  }

  /**
   * Ensures the adapter is started and `baseUrl` is available.
   * - If `source` is a URL, uses it directly.
   * - If `source` is a directory, starts a local static server with a startup timeout.
   */
  async function ensureStarted(): Promise<void> {
    if (baseUrl) return;
    if (isUrl) {
      baseUrl = opts.source.replace(/\/$/, "");
      return;
    }
    if (!existsSync(opts.source)) {
      throw new Error(`Storybook static directory not found: ${opts.source}`);
    }
    const port = opts.port ?? DEFAULT_PORT;
    server = http.createServer((req, res) =>
      handler(req, res, { public: opts.source, cleanUrls: false })
    );
    await new Promise<void>((resolve, reject) => {
      let done = false;
      const onError = (err: unknown) => {
        if (done) return;
        done = true;
        reject(err instanceof Error ? err : new Error("Server start failed"));
      };
      const timeout = setTimeout(() => {
        onError(new Error("Server start timed out"));
      }, SERVER_START_TIMEOUT_MS);
      server!.once("error", onError);
      server!.listen(port, () => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        server!.off("error", onError);
        resolve();
      });
    });
    baseUrl = `http://localhost:${port}`;
  }

  /**
   * Discovers Storybook cases in the current browser page by evaluating inside the page context.
   * Requires a `PageWithEvaluate` that can execute code in the browser and optionally be closed later.
   * Applies a timeout for resiliency and validates the Storybook globals.
   */
  async function discoverCasesFromBrowser(
    pageCtx: PageWithEvaluate
  ): Promise<Record<string, unknown>> {
    if (!("evaluate" in pageCtx) || typeof pageCtx.evaluate !== "function") {
      throw new Error("Page context does not support evaluate()");
    }

    const attempt = async (): Promise<Record<string, unknown>> => {
      const evalPromise = (pageCtx.evaluate as NonNullable<PageWithEvaluate["evaluate"]>)(async () => {
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
          await new Promise(res => setTimeout(res, DISCOVERY_RETRY_DELAY_MS * (i + 1)));
          continue;
        }
        throw e;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Story discovery failed");
  }

  /**
   * Creates a predicate function that filters stories by `include` and `exclude` patterns.
   * Patterns support `*` wildcard. Invalid patterns are ignored.
   */
  function createTestCaseFilter(opts: {
    include?: string | string[];
    exclude?: string | string[];
  }) {
    const includePatterns = Array.isArray(opts.include)
      ? opts.include
      : opts.include
        ? [opts.include]
        : [];
    const excludePatterns = Array.isArray(opts.exclude)
      ? opts.exclude
      : opts.exclude
        ? [opts.exclude]
        : [];

    const includeRegexes = includePatterns
      .map(p => {
        const r = toSafeRegex(p);
        if (!r) console.warn(`[storybook-adapter] Ignoring invalid include pattern: ${p}`);
        return r;
      })
      .filter((r): r is RegExp => !!r);
    const excludeRegexes = excludePatterns
      .map(p => {
        const r = toSafeRegex(p);
        if (!r) console.warn(`[storybook-adapter] Ignoring invalid exclude pattern: ${p}`);
        return r;
      })
      .filter((r): r is RegExp => !!r);

    return (story: TestCaseMeta) => {
      const storyId = story.id;

      // Check include patterns
      if (includeRegexes.length > 0) {
        const matchesInclude = includeRegexes.some(regex =>
          regex.test(storyId)
        );
        if (!matchesInclude) return false;
      }

      // Check exclude patterns
      if (excludeRegexes.length > 0) {
        const matchesExclude = excludeRegexes.some(regex =>
          regex.test(storyId)
        );
        if (matchesExclude) return false;
      }

      return true;
    };
  }

  /**
   * Normalizes and expands raw Storybook `extract()` output into TestCaseInstanceMeta[].
   * Applies runtime guards, include/exclude filtering, skip handling, and case-level config.
   */
  function normalizeStories(
    stories: Record<string, unknown>,
    options: {
      include?: string | string[];
      exclude?: string | string[];
      baseUrl: string;
      viewportKeys: string[];
    }
  ): TestCaseInstanceMeta[] {
    const metas: TestCaseMeta[] = [];
    const currentBaseUrl = options.baseUrl.replace(/\/$/, "");
    for (const raw of Object.values(stories)) {
      if (!raw || typeof raw !== "object") continue;
      const storyObj = raw as TestCaseMeta;

      const id = typeof storyObj.id === "string" ? storyObj.id : undefined;
      const title =
        typeof storyObj.title === "string" ? storyObj.title : (id ?? "");
      if (!id) continue;

      const vt = storyObj.visualTesting ?? {};
      const skip = typeof vt.skip === "boolean" ? vt.skip : false;
      const screenshotTarget =
        typeof vt.screenshotTarget === "string"
          ? vt.screenshotTarget
          : undefined;
      const threshold =
        typeof vt.threshold === "number" ? vt.threshold : undefined;
      const browser =
        Array.isArray(vt.browser) || typeof vt.browser === "string"
          ? (vt.browser as BrowserName | BrowserName[])
          : undefined;
      const viewport =
        typeof vt.viewport === "object" && vt.viewport !== null
          ? (vt.viewport as Viewport)
          : undefined;

      metas.push({
        id,
        title,
        visualTesting: { skip, screenshotTarget, threshold, browser, viewport },
      });
    }

    // Build filter predicate from include/exclude
    const filter = createTestCaseFilter({
      include: options.include,
      exclude: options.exclude,
    });
    const filtered = metas.filter(s => !s.visualTesting?.skip).filter(filter);

    const instances: TestCaseInstanceMeta[] = [];
    for (const s of filtered) {
      const cfg = s.visualTesting;
      for (const vk of options.viewportKeys) {
        instances.push({
          id: s.id,
          title: s.title,
          caseId: s.id,
          variantId: vk,
          url: `${currentBaseUrl}/iframe.html?id=${encodeURIComponent(s.id)}`,
          screenshotTarget: cfg?.screenshotTarget ?? "#storybook-root",
          viewport: cfg?.viewport,
          threshold: cfg?.threshold,
        });
      }
    }
    return instances;
  }

  return {
    name: "storybook",
    /** Starts the adapter and returns `{ baseUrl }` of the Storybook under test. */
    async start() {
      await ensureStarted();
      return { 
        baseUrl,
        initialPageUrl: `${baseUrl}/iframe.html`
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

      if (!baseUrl) {
        throw new Error(
          "Adapter not started. Call start() before listCases()."
        );
      }
      const currentBaseUrl = baseUrl;
      let keys = o?.viewport ? Object.keys(o.viewport) : ["default"];
      if (!keys || keys.length === 0) keys = ["default"];
      // Sort viewport keys deterministically
      keys.sort((a, b) => a.localeCompare(b));

      return normalizeStories(cases, {
        include: opts?.include,
        exclude: opts?.exclude,
        baseUrl: currentBaseUrl!,
        viewportKeys: keys,
      });
    },
    /** Stops the adapter server (if any) and clears `baseUrl`. Safe to call multiple times. */
    async stop() {
      if (!server) {
        baseUrl = undefined;
        return;
      }
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = null;
      baseUrl = undefined;
    },
  };
}
