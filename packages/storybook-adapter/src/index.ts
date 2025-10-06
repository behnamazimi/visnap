import type { TestCaseAdapter, TestCaseMeta, TestCaseInstance, ViewportMap } from "@visual-testing-tool/protocol";
import http from "node:http";
import handler from "serve-handler";

export type CreateStorybookAdapterOptions = {
  source: string;
  port?: number;
  
  //External discovery (can use Playwright, Puppeteer, etc.)
  discover?: (ctx: { baseUrl: string; source: string }) => Promise<TestCaseMeta[]>;
};

export function createStorybookAdapter(opts: CreateStorybookAdapterOptions): TestCaseAdapter {
  let server: http.Server | null = null;
  let baseUrl: string | undefined;
  const isUrl = /^https?:\/\//i.test(opts.source);

  async function ensureStarted(): Promise<void> {
    if (baseUrl) return;
    if (isUrl) {
      baseUrl = opts.source.replace(/\/$/, "");
      return;
    }
    const port = opts.port ?? 6006;
    server = http.createServer((req, res) => handler(req, res, { public: opts.source }));
    await new Promise<void>(resolve => server!.listen(port, resolve));
    baseUrl = `http://localhost:${port}`;
  }

  return {
    name: "storybook",
    async start() {
      await ensureStarted();
      return { baseUrl };
    },
    async listCases(): Promise<TestCaseMeta[]> {
      await ensureStarted();
      if (!opts.discover) {
        throw new Error("createStorybookAdapter requires a discover callback for story extraction.");
      }
      return opts.discover({ baseUrl: baseUrl!, source: opts.source });
    },
    async expand(caseId: string, o?: { viewport?: ViewportMap }): Promise<TestCaseInstance[]> {
      const keys = o?.viewport ? Object.keys(o.viewport) : ["default"];
      return keys.map(vk => ({
        caseId,
        variantId: vk,
        url: `/iframe.html?id=${caseId}`,
        selector: "#storybook-root",
      }));
    },
    async stop() {
      if (!server) return;
      await new Promise<void>(resolve => server!.close(() => resolve()));
      server = null;
    },
  };
}