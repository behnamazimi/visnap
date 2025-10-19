/**
 * @fileoverview Test helper functions for reporter tests
 */

import { vi } from "vitest";

/**
 * Creates a mock file system with tracking for fs operations
 */
export function mockFileSystem() {
  const writtenFiles = new Map<string, string>();
  const createdDirs = new Set<string>();

  const writeFileSync = vi.fn((path: string, content: string) => {
    writtenFiles.set(path, content);
  });

  const mkdirSync = vi.fn((path: string, _options?: any) => {
    createdDirs.add(path);
  });

  const readFileSync = vi.fn((path: any, _encoding?: string) => {
    if (path.includes("template.html")) {
      return `<!DOCTYPE html>
<html>
<head>
  <title>{{TITLE}}</title>
  <style>{{STYLES}}</style>
</head>
<body>
  <div id="app" x-data="app()">
    <h1>{{TITLE}}</h1>
    <div id="data">{{DATA}}</div>
  </div>
  <script>{{SCRIPT}}</script>
</body>
</html>`;
    }
    if (path.includes("styles.css")) {
      return `body { font-family: Arial, sans-serif; }`;
    }
    if (path.includes("alpine-app.js")) {
      return `function app() { return { init() { console.log('App initialized'); } }; }`;
    }
    throw new Error("File not found");
  });

  return {
    writeFileSync,
    mkdirSync,
    readFileSync,
    writtenFiles,
    createdDirs,
    getWrittenFile: (path: string) => writtenFiles.get(path),
    hasCreatedDir: (path: string) => createdDirs.has(path),
    reset: () => {
      writtenFiles.clear();
      createdDirs.clear();
      writeFileSync.mockClear();
      mkdirSync.mockClear();
      readFileSync.mockClear();
    },
  };
}

/**
 * Captures and parses JSON content written to a file
 */
export function captureWrittenJson<T = any>(
  writeFileSync: ReturnType<typeof vi.fn>,
  callIndex: number = 0
): T {
  const call = writeFileSync.mock.calls[callIndex];
  if (!call) {
    throw new Error(`No call found at index ${callIndex}`);
  }
  const content = call[1] as string;
  return JSON.parse(content);
}

/**
 * Captures written file content
 */
export function captureWrittenFile(
  writeFileSync: ReturnType<typeof vi.fn>,
  callIndex: number = 0
): { path: string; content: string } {
  const call = writeFileSync.mock.calls[callIndex];
  if (!call) {
    throw new Error(`No call found at index ${callIndex}`);
  }
  return {
    path: call[0] as string,
    content: call[1] as string,
  };
}

/**
 * Extracts JSON data from HTML report
 */
export function extractDataFromHtml(html: string): any {
  const dataMatch = html.match(/<div id="data">(.*?)<\/div>/s);
  if (!dataMatch) {
    throw new Error("Could not find data div in HTML");
  }
  return JSON.parse(dataMatch[1]);
}

/**
 * Validates timestamp is recent (within given milliseconds)
 */
export function isRecentTimestamp(
  timestamp: string,
  withinMs: number = 5000
): boolean {
  const now = Date.now();
  const ts = new Date(timestamp).getTime();
  return Math.abs(now - ts) <= withinMs;
}

/**
 * Creates a mock asset file reader for template builder tests
 */
export function mockAssetFiles() {
  return {
    template: `<!DOCTYPE html>
<html>
<head>
  <title>{{TITLE}}</title>
  <style>{{STYLES}}</style>
</head>
<body>
  <div id="app" x-data="app()">
    <h1>{{TITLE}}</h1>
    <div id="data">{{DATA}}</div>
  </div>
  <script>{{SCRIPT}}</script>
</body>
</html>`,
    styles: `body { font-family: Arial, sans-serif; }`,
    script: `function app() { return { init() { console.log('App initialized'); } }; }`,
  };
}
