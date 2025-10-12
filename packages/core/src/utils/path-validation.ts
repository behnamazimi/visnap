import { resolve, relative, isAbsolute } from "path";

/**
 * Validates that a path is safe and doesn't contain path traversal attempts
 */
export function validatePath(path: string, baseDir: string): string {
  // Check for null bytes and other dangerous characters
  if (path.includes("\0") || path.includes("\x00")) {
    throw new Error("Path contains null bytes which are not allowed");
  }

  // Check for suspicious patterns
  if (path.includes("//") || path.includes("\\\\")) {
    throw new Error("Path contains suspicious double separators");
  }

  // Resolve the path relative to base directory
  const resolvedPath = resolve(baseDir, path);
  const relativePath = relative(baseDir, resolvedPath);

  // Check for path traversal attempts
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(
      `Path traversal detected: ${path} resolves outside base directory`
    );
  }

  // Additional check: ensure the resolved path is still within base directory
  if (!resolvedPath.startsWith(resolve(baseDir))) {
    throw new Error(
      `Path resolves outside base directory: ${path} -> ${resolvedPath}`
    );
  }

  return resolvedPath;
}

/**
 * Validates screenshot directory path
 */
export function validateScreenshotDir(screenshotDir: string): string {
  if (!screenshotDir || typeof screenshotDir !== "string") {
    throw new Error("Screenshot directory must be a non-empty string");
  }

  // Check for null bytes and control characters
  if (screenshotDir.includes("\0") || screenshotDir.includes("\x00")) {
    throw new Error(
      "Screenshot directory contains null bytes which are not allowed"
    );
  }

  // Check for path traversal sequences
  if (screenshotDir.includes("..") || screenshotDir.includes("~")) {
    throw new Error(
      `Invalid screenshot directory: ${screenshotDir}. Directory cannot contain path traversal sequences.`
    );
  }

  // Check for suspicious patterns
  if (screenshotDir.includes("//") || screenshotDir.includes("\\\\")) {
    throw new Error(
      "Screenshot directory contains suspicious double separators"
    );
  }

  // Check for absolute paths in user input (should be relative to cwd)
  if (isAbsolute(screenshotDir)) {
    throw new Error(
      `Screenshot directory should be relative to current working directory, not absolute: ${screenshotDir}`
    );
  }

  // Check for empty segments or just separators
  if (
    screenshotDir === "/" ||
    screenshotDir === "\\" ||
    screenshotDir.trim() === ""
  ) {
    throw new Error("Screenshot directory cannot be empty or just a separator");
  }

  return screenshotDir;
}
