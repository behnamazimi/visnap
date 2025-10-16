import { access, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

import type { StorageAdapter, StorageKind } from "@visnap/protocol";

class StorageError extends Error {
  public readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
    this.code = "STORAGE_ERROR";
  }
}

export interface FsStorageAdapterOptions {
  screenshotDir: string;
  baseDirName?: string;
  currentDirName?: string;
  diffDirName?: string;
}

export class FsStorageAdapter implements StorageAdapter {
  private readonly screenshotDir: string;
  private readonly baseDir: string;
  private readonly currentDir: string;
  private readonly diffDir: string;

  constructor(options: FsStorageAdapterOptions) {
    this.screenshotDir = resolve(options.screenshotDir);
    this.baseDir = join(this.screenshotDir, options.baseDirName ?? "base");
    this.currentDir = join(
      this.screenshotDir,
      options.currentDirName ?? "current"
    );
    this.diffDir = join(this.screenshotDir, options.diffDirName ?? "diff");
  }

  private getDirForKind(kind: StorageKind): string {
    switch (kind) {
      case "base":
        return this.baseDir;
      case "current":
        return this.currentDir;
      case "diff":
        return this.diffDir;
      default:
        throw new Error(`Invalid storage kind: ${kind}`);
    }
  }

  private async ensureDir(dir: string): Promise<void> {
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }

  private validateFilename(filename: string): string {
    // Reject path traversal or directory separators
    if (
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.includes("..")
    ) {
      throw new StorageError("Invalid filename");
    }
    // Sanitize remaining unsafe characters by normalizing to underscore
    const sanitized = filename.replace(/[^a-zA-Z0-9\-_.]/g, "_");
    return sanitized;
  }

  private validatePath(filePath: string, baseDir: string): string {
    const resolved = resolve(filePath);
    if (!resolved.startsWith(baseDir)) {
      throw new StorageError(`Path traversal detected: ${filePath}`);
    }
    return resolved;
  }

  async write(
    kind: StorageKind,
    filename: string,
    buffer: Uint8Array
  ): Promise<string> {
    const safeFilename = this.validateFilename(filename);
    const dir = this.getDirForKind(kind);
    await this.ensureDir(dir);

    const filePath = join(dir, safeFilename);
    const validatedPath = this.validatePath(filePath, dir);

    await writeFile(validatedPath, buffer);
    return validatedPath;
  }

  async read(kind: StorageKind, filename: string): Promise<Uint8Array> {
    const safeFilename = this.validateFilename(filename);
    const dir = this.getDirForKind(kind);
    const filePath = join(dir, safeFilename);
    const validatedPath = this.validatePath(filePath, dir);

    const buffer = await readFile(validatedPath);
    // Ensure Uint8Array is returned (Buffer is a subclass but tests expect Uint8Array)
    return new Uint8Array(buffer);
  }

  async getReadablePath(kind: StorageKind, filename: string): Promise<string> {
    const safeFilename = this.validateFilename(filename);
    const dir = this.getDirForKind(kind);
    const filePath = join(dir, safeFilename);
    return this.validatePath(filePath, dir);
  }

  async exists(kind: StorageKind, filename: string): Promise<boolean> {
    try {
      const safeFilename = this.validateFilename(filename);
      const dir = this.getDirForKind(kind);
      const filePath = join(dir, safeFilename);
      const validatedPath = this.validatePath(filePath, dir);

      await access(validatedPath);
      return true;
    } catch {
      return false;
    }
  }

  async list(kind: StorageKind): Promise<string[]> {
    const dir = this.getDirForKind(kind);
    try {
      await this.ensureDir(dir);
      const files = await readdir(dir);
      return files.filter(file => file.endsWith(".png"));
    } catch {
      return [];
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for filesystem adapter
    // Files persist on disk as expected
  }
}
