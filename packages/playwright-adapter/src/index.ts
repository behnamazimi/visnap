import type {
  BrowserAdapter,
  ScreenshotOptions,
  ScreenshotResult,
  BrowserName as BrowserNameProtocol,
  BrowserAdapterInitOptions,
} from "@visual-testing-tool/protocol";
import {
  chromium,
  firefox,
  webkit,
  type BrowserType,
  type Browser,
  type Page,
} from "playwright-core";

/**
 * Options to configure the Playwright browser adapter.
 * - `launch`: Browser launch options including `browser`, `headless`, `channel`, plus passthrough options.
 * - `context`: Defaults applied to each capture's isolated context (visual stability flags, storage state file, etc.).
 * - `navigation`: URL handling and navigation behavior including `baseUrl`, `waitUntil`, and `timeoutMs`.
 */
export interface PlaywrightAdapterOptions {
  launch?: {
    browser?: BrowserNameProtocol;
    headless?: boolean;
    channel?: string;
    [key: string]: unknown;
  };
  context?: {
    colorScheme?: "light" | "dark";
    reducedMotion?: "reduce" | "no-preference";
    storageStatePath?: string;
    [key: string]: unknown;
  };
  navigation?: {
    baseUrl?: string;
    waitUntil?: "load" | "domcontentloaded" | "networkidle";
    timeoutMs?: number;
  };
}

/**
 * Creates a Playwright-backed `BrowserAdapter` for opening pages and capturing screenshots.
 * Public API remains unchanged; adds resilient navigation, baseUrl support, and safe cleanup.
 */
export function createPlaywrightAdapter(
  opts: PlaywrightAdapterOptions = {}
): BrowserAdapter {
  let browserType: BrowserType | null = null;
  let browser: Browser | null = null;
  const defaultTimeout = opts.navigation?.timeoutMs ?? 30000;

  function pickBrowser(name?: BrowserNameProtocol): BrowserType {
    const b = (name ||
      opts.launch?.browser ||
      "chromium") as BrowserNameProtocol;
    if (b === "firefox") return firefox;
    if (b === "webkit") return webkit;
    return chromium;
  }

  const resolveScreenshotTarget = (selector?: string): string => {
    if (!selector || selector === "story-root") return "#storybook-root";
    if (selector === "body") return "body";
    return selector;
  };

  /** Ensures the adapter has been initialized. */
  function ensureInitialized(): void {
    if (!browser) throw new Error("Playwright adapter not initialized");
  }

  /** Builds an absolute URL using `navigation.baseUrl` when a relative URL is provided. */
  function buildUrl(url: string): string {
    const trimmed = (url ?? "").toString().trim();
    const base = opts.navigation?.baseUrl;
    try {
      return new URL(trimmed, base || undefined).toString();
    } catch {
      return trimmed;
    }
  }

  async function waitForNetworkIdle(page: Page, timeout: number): Promise<void> {
    // Heuristic: wait for network to be quiet by waiting on load + short idle
    try {
      await page.waitForLoadState("networkidle", { timeout });
    } catch {
      // fall back to a small delay; not all drivers support networkidle well
      await page.waitForTimeout(Math.min(1000, Math.floor(timeout / 10)));
    }
  }

  return {
    name: "playwright",
    /** Launches a browser instance. Safe to call multiple times. */
    async init(initOpts?: BrowserAdapterInitOptions) {
      browserType = pickBrowser(initOpts?.browser);
      if (browser) return; // idempotent
      browser = await browserType.launch({
        headless: opts.launch?.headless ?? true,
        channel: opts.launch?.channel,
        ...opts.launch,
      });
    },

    /** Opens a new page at the given URL using configured navigation settings. */
    async openPage(url: string): Promise<Page> {
      ensureInitialized();
      const page = await browser!.newPage();
      page.setDefaultTimeout(defaultTimeout);
      const targetUrl = buildUrl(url);
      await page.goto(targetUrl, {
        waitUntil: opts.navigation?.waitUntil ?? "load",
        timeout: defaultTimeout,
      });
      if ((opts.navigation?.waitUntil ?? "load") === "networkidle") {
        await waitForNetworkIdle(page, defaultTimeout);
      }
      return page;
    },

    /** Captures a screenshot of the provided URL/selector with isolation per capture. */
    async capture(s: ScreenshotOptions): Promise<ScreenshotResult> {
      ensureInitialized();

      const start = Date.now();
      const timeout = defaultTimeout;
      const targetUrl = buildUrl(s.url);

      // Per-capture isolated context
      const context = await browser!.newContext({
        ...opts.context,
        colorScheme: opts.context?.colorScheme ?? "light",
        reducedMotion: opts.context?.reducedMotion ?? "reduce",
        ...(opts.context?.storageStatePath
          ? { storageState: opts.context.storageStatePath }
          : {}),
      });

      let page: Page | null = null;
      try {
        page = await context.newPage();
        page.setDefaultTimeout(timeout);

        // Viewport handling
        if (s.viewport) {
          await page.setViewportSize({
            width: s.viewport.width,
            height: s.viewport.height,
          });
        }

        await page.goto(targetUrl, {
          waitUntil: opts.navigation?.waitUntil ?? "load",
          timeout,
        });
        if ((opts.navigation?.waitUntil ?? "load") === "networkidle") {
          await waitForNetworkIdle(page, timeout);
        }

        // Additional waits per protocol
        if (typeof s.waitFor === "number") await page.waitForTimeout(s.waitFor);
        if (typeof s.waitFor === "string" && s.waitFor.trim())
          await page.waitForSelector(s.waitFor, { timeout });

        const screenshotTarget = resolveScreenshotTarget(s.screenshotTarget);
        const storyElement = await page.waitForSelector(screenshotTarget, {
          timeout: 2000,
          state: "attached",
        });
        if (!storyElement) {
          const message = `Screenshot target not found with selector ${screenshotTarget} for case ${s.id}`;
          console.error(message);
          throw new Error(message);
        }

        const buffer = (await storyElement.screenshot({
          type: "png",
        })) as unknown as Uint8Array;

        return { buffer, meta: { elapsedMs: Date.now() - start, id: s.id } };
      } finally {
        try {
          await page?.close();
        } catch {
          // ignore
        }
        await context.close();
      }
    },

    /** Closes the browser and disposes adapter resources. Safe to call multiple times. */
    async dispose() {
      await browser?.close();
      browser = null;
      browserType = null;
    },
  };
}
