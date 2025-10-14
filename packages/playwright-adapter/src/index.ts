import type {
  BrowserAdapter,
  ScreenshotOptions,
  ScreenshotResult,
  BrowserName as BrowserNameProtocol,
  BrowserAdapterInitOptions,
} from "@visnap/protocol";
import { type BrowserType, type Browser, type Page } from "playwright-core";

import { createBrowserContext, navigateToUrl } from "./browser-context";
import { performScreenshotCapture } from "./screenshot-capture";
import { selectBrowserType, buildAbsoluteUrl } from "./utils";

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
  injectCSS?: string;
}

/**
 * Creates a Playwright-backed `BrowserAdapter` for opening pages and capturing screenshots.
 * Public API remains unchanged; adds resilient navigation, baseUrl support, and safe cleanup.
 */
export function createAdapter(
  opts: PlaywrightAdapterOptions = {}
): BrowserAdapter {
  let browserType: BrowserType | null = null;
  let browser: Browser | null = null;
  const defaultTimeout = opts.navigation?.timeoutMs ?? 30000;

  /** Ensures the adapter has been initialized. */
  function ensureInitialized(): void {
    if (!browser) throw new Error("Playwright adapter not initialized");
  }

  return {
    name: "playwright",
    /** Launches a browser instance. Safe to call multiple times. */
    async init(initOpts?: BrowserAdapterInitOptions) {
      browserType = selectBrowserType(
        initOpts?.browser || opts.launch?.browser
      );
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
      const targetUrl = buildAbsoluteUrl(url, opts.navigation?.baseUrl);
      await navigateToUrl(page, targetUrl, opts, defaultTimeout);
      return page;
    },

    /** Captures a screenshot of the provided URL/selector with isolation per capture. */
    async capture(s: ScreenshotOptions): Promise<ScreenshotResult> {
      ensureInitialized();

      const targetUrl = buildAbsoluteUrl(s.url, opts.navigation?.baseUrl);

      // Create per-capture isolated context
      const context = await createBrowserContext(browser!, opts);

      try {
        return await performScreenshotCapture(
          context,
          opts,
          {
            ...s,
            url: targetUrl,
          },
          defaultTimeout
        );
      } finally {
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

// Re-export interaction types for user convenience
export type { InteractionAction } from "@visnap/protocol";
