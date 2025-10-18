/**
 * @fileoverview Server management utilities for Storybook adapter
 *
 * Provides functions for starting and managing a local static file server
 * for Storybook static builds or connecting to existing Storybook instances.
 */

import { existsSync } from "node:fs";
import http from "node:http";

import handler from "serve-handler";

const DEFAULT_PORT = 4477;
const SERVER_START_TIMEOUT_MS = 5000;

export interface ServerManager {
  ensureStarted(): Promise<void>;
  getBaseUrl(): string | undefined;
  stop(): Promise<void>;
}

/**
 * Creates a server manager that handles starting/stopping the Storybook server
 */
export function createServerManager(
  source: string,
  port?: number
): ServerManager {
  let server: http.Server | null = null;
  let baseUrl: string | undefined;
  const isUrl = /^https?:\/\//i.test(source);

  /**
   * Ensures the adapter is started and `baseUrl` is available.
   * - If `source` is a URL, uses it directly.
   * - If `source` is a directory, starts a local static server with a startup timeout.
   */
  async function ensureStarted(): Promise<void> {
    if (baseUrl) return;

    if (isUrl) {
      baseUrl = source.replace(/\/$/, "");
      return;
    }

    if (!existsSync(source)) {
      throw new Error(`Storybook static directory not found: ${source}`);
    }

    const serverPort = port ?? DEFAULT_PORT;
    server = http.createServer((req, res) =>
      handler(req, res, { public: source, cleanUrls: false })
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
      server!.listen(serverPort, () => {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        server!.off("error", onError);
        resolve();
      });
    });

    baseUrl = `http://localhost:${serverPort}`;
  }

  /**
   * Stops the adapter server (if any) and clears `baseUrl`. Safe to call multiple times.
   */
  async function stop(): Promise<void> {
    if (!server) {
      baseUrl = undefined;
      return;
    }
    await new Promise<void>(resolve => server!.close(() => resolve()));
    server = null;
    baseUrl = undefined;
  }

  return {
    ensureStarted,
    getBaseUrl: () => baseUrl,
    stop,
  };
}
