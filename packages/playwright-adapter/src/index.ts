import { chromium, firefox, webkit, type BrowserType, type Browser, type LaunchOptions, type BrowserContextOptions } from "playwright-core";
import type {
    BrowserAdapter,
    ScreenshotOptions,
    ScreenshotResult,
    BrowserName,
    BrowserAdapterInitOptions,
} from "@visual-testing-tool/protocol";

export type PlaywrightAdapterOptions = {
    launch?: LaunchOptions & { browser?: BrowserName; channel?: string };
    context?: BrowserContextOptions & {
        reducedMotion?: "reduce" | "no-preference";
        colorScheme?: "light" | "dark" | "no-preference";
        storageStatePath?: string;
    };
    navigation?: {
        waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
        timeoutMs?: number;
        baseUrl?: string; // override/force a base for relative URLs if core doesn't
    };
    concurrency?: number; // pages in parallel
};

export function createPlaywrightAdapter(opts: PlaywrightAdapterOptions = {}): BrowserAdapter {
    let browserType: BrowserType | null = null;
    let browser: Browser | null = null;

    function pickBrowser(name?: BrowserName): BrowserType {
        const b = (name || opts.launch?.browser || "chromium") as BrowserName;
        if (b === "firefox") return firefox;
        if (b === "webkit") return webkit;
        return chromium;
    }

    return {
        name: "playwright",
        async init(initOpts?: BrowserAdapterInitOptions) {
            browserType = pickBrowser(initOpts?.browser);
            browser = await browserType.launch({
                headless: true,
                channel: opts.launch?.channel,
                ...opts.launch,
            });
        },

        async capture(s: ScreenshotOptions): Promise<ScreenshotResult> {
            if (!browser) throw new Error("Playwright adapter not initialized");

            // Build URL
            const url = (() => {
                if (/^https?:\/\//i.test(s.url)) return s.url;
                if (opts.navigation?.baseUrl) return new URL(s.url, opts.navigation.baseUrl).toString();
                return s.url; // assume absolute
            })();

            // Per-capture context for isolation
            const context = await browser.newContext({
                ...opts.context,
                // Normalize for visual stability
                colorScheme: opts.context?.colorScheme ?? "light",
                reducedMotion: opts.context?.reducedMotion ?? "reduce",
                // Load storage state from file if provided
                ...(opts.context?.storageStatePath
                    ? { storageState: opts.context.storageStatePath }
                    : {}),
            });

            const page = await context.newPage();

            // Viewport handling
            if (s.viewport) {
                await page.setViewportSize({ width: s.viewport.width, height: s.viewport.height });
            }

            const start = Date.now();

            // Navigation
            const waitUntil = opts.navigation?.waitUntil ?? "networkidle";
            const timeout = opts.navigation?.timeoutMs ?? 30000;
            await page.goto(url, { waitUntil, timeout });

            // Waits per protocol
            if (typeof s.waitFor === "number") await page.waitForTimeout(s.waitFor);
            if (typeof s.waitFor === "string" && s.waitFor.trim()) await page.waitForSelector(s.waitFor, { timeout });

            // Screenshot
            let buffer: Uint8Array;
            if (s.selector) {
                const el = await page.$(s.selector);
                if (!el) {
                    await context.close();
                    throw new Error(`Selector not found: ${s.selector}`);
                }
                buffer = (await el.screenshot({ type: "png" })) as unknown as Uint8Array;
            } else {
                buffer = (await page.screenshot({ type: "png", fullPage: true })) as unknown as Uint8Array;
            }

            await context.close();

            return { buffer, meta: { elapsedMs: Date.now() - start } };
        },

        async dispose() {
            await browser?.close();
            browser = null;
            browserType = null;
        },
    };
}

export type { BrowserAdapter } from "@visual-testing-tool/protocol";


