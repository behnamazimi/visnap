import { createServer } from "http";
import type { Server } from "http";

import serveHandler from "serve-handler";

import { DEFAULT_SERVER_PORT } from "../constants";
import { loadConfigFile } from "../lib";

import { StorybookError } from "./error-handler";
import { validateUrl } from "./validation";

export type StorybookServeResult = {
  url: string;
  server: Server | null;
} | null;

export const getStorybookUrl = async (): Promise<StorybookServeResult> => {
  const config = await loadConfigFile();
  if (!config) return null;

  const source = config.storybook.source;
  if (!source) return null;

  const isUrl = /^https?:\/\//i.test(source);
  if (isUrl) {
    if (!validateUrl(source)) {
      throw new StorybookError(`Invalid storybook URL: ${source}`);
    }
    return { url: `${source.replace(/\/$/, "")}/iframe.html`, server: null };
  }

  const port = DEFAULT_SERVER_PORT;
  const server = createServer((request, response) => {
    return serveHandler(request, response, {
      public: source,
      cleanUrls: false,
    });
  });
  server.listen(port);
  return { server, url: `http://localhost:${port}/iframe.html` };
};
