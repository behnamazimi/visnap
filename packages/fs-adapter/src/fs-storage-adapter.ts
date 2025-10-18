/**
 * @fileoverview Filesystem storage adapter implementation
 *
 * Filesystem-based storage for screenshots with path traversal protection,
 * organized directory structure, and comprehensive error handling.
 */

import { access, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

import type { StorageAdapter, StorageKind } from "@visnap/protocol";

/**
 * Error thrown when filesystem storage operations fail
 */
class StorageError extends Error {
  public readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
    this.code = "STORAGE_ERROR";
  }
}

/**
 * Configuration options for the filesystem storage adapter
 * @property screenshotDir - Base directory for storing screenshots
 * @property baseDirName - Name of the baseline directory (default: "base")
 * @property currentDirName - Name of the current directory (default: "current")
 * @property diffDirName - Name of the diff directory (default: "diff")
 */
export interface FsStorageAdapterOptions {
  screenshotDir: string;
  baseDirName?: string;
  currentDirName?: string;
  diffDirName?: string;
}

/**
 * Filesystem-based storage adapter for managing screenshot files
 *
 * Organizes screenshots into base/, current/, and diff/ directories with
 * secure file operations and path traversal protection.
 *
 * @example
 * ```typescript
 * const adapter = new FsStorageAdapter({
 *   screenshotDir: "./screenshots",
 *   baseDirName: "baseline",
 *   currentDirName: "current"
 * });
 * ```
 */
export class FsStorageAdapter implements StorageAdapter {
  private readonly screenshotDir: string;
  private readonly baseDir: string;
  private readonly currentDir: string;
  private readonly diffDir: string;

  /**
   * Creates a new filesystem storage adapter
   * @param options - Configuration options for the adapter
   */
  constructor(options: FsStorageAdapterOptions) {
    this.screenshotDir = resolve(options.screenshotDir);
    this.baseDir = join(this.screenshotDir, options.baseDirName ?? "base");
    this.currentDir = join(
      this.screenshotDir,
      options.currentDirName ?? "current"
    );
    this.diffDir = join(this.screenshotDir, options.diffDirName ?? "diff");
  }

  /**
   * Gets the directory path for a specific storage kind
   * @param kind - Storage kind (base, current, or diff)
   * @returns Absolute path to the storage directory
   * @throws {Error} If storage kind is invalid
   */
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

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dir - Directory path to ensure
   */
  private async ensureDir(dir: string): Promise<void> {
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Validates and sanitizes a filename to prevent path traversal attacks
   * @param filename - Filename to validate
   * @returns Sanitized filename safe for filesystem use
   * @throws {StorageError} If filename contains path traversal characters
   */
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

  /**
   * Validates that a file path is within the expected base directory
   * @param filePath - File path to validate
   * @param baseDir - Base directory that the path must be within
   * @returns Resolved absolute path
   * @throws {StorageError} If path traversal is detected
   */
  private validatePath(filePath: string, baseDir: string): string {
    const resolved = resolve(filePath);
    if (!resolved.startsWith(baseDir)) {
      throw new StorageError(`Path traversal detected: ${filePath}`);
    }
    return resolved;
  }

  /**
   * Writes screenshot data to storage
   * @param kind - Storage directory type (base, current, or diff)
   * @param filename - Name of the file to write
   * @param buffer - Screenshot data as Uint8Array
   * @returns Absolute path to the written file
   * @throws {StorageError} If filename is invalid or write operation fails
   */
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

  /**
   * Reads screenshot data from storage
   * @param kind - Storage directory type (base, current, or diff)
   * @param filename - Name of the file to read
   * @returns Screenshot data as Uint8Array
   * @throws {StorageError} If filename is invalid or read operation fails
   */
  async read(kind: StorageKind, filename: string): Promise<Uint8Array> {
    const safeFilename = this.validateFilename(filename);
    const dir = this.getDirForKind(kind);
    const filePath = join(dir, safeFilename);
    const validatedPath = this.validatePath(filePath, dir);

    const buffer = await readFile(validatedPath);
    // Ensure Uint8Array is returned (Buffer is a subclass but tests expect Uint8Array)
    return new Uint8Array(buffer);
  }

  /**
   * Gets a readable file path for external tools (e.g., image comparison libraries)
   * @param kind - Storage directory type (base, current, or diff)
   * @param filename - Name of the file
   * @returns Absolute path to the file
   * @throws {StorageError} If filename is invalid
   */
  async getReadablePath(kind: StorageKind, filename: string): Promise<string> {
    const safeFilename = this.validateFilename(filename);
    const dir = this.getDirForKind(kind);
    const filePath = join(dir, safeFilename);
    return this.validatePath(filePath, dir);
  }

  /**
   * Checks if a file exists in storage
   * @param kind - Storage directory type (base, current, or diff)
   * @param filename - Name of the file to check
   * @returns True if file exists, false otherwise
   */
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

  /**
   * Lists all PNG files in a storage directory
   * @param kind - Storage directory type (base, current, or diff)
   * @returns Array of PNG filenames
   */
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

  /**
   * Cleanup method for filesystem adapter
   * No cleanup needed as files persist on disk as expected
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for filesystem adapter
    // Files persist on disk as expected
  }
}
