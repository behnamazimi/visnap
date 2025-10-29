import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Walk up from the provided directory to find a Git repository root.
 * Returns the directory path that contains the `.git` entry, or null if not found.
 */
export function isInsideGitRepo(startDir: string): string | null {
  let dir = startDir;
  while (dir !== "/" && dir !== ".") {
    const gitPath = join(dir, ".git");
    if (existsSync(gitPath)) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export interface EnsureGitignoreResult {
  created: boolean;
  added: string[];
}

/**
 * Ensure the given entries exist in the repository's .gitignore file.
 * Creates the file if it does not exist. Idempotent: avoids duplicates.
 */
export function ensureGitignoreEntries(
  gitRoot: string,
  entries: string[]
): EnsureGitignoreResult {
  const gitignorePath = join(gitRoot, ".gitignore");

  const existingContent = existsSync(gitignorePath)
    ? readFileSync(gitignorePath, "utf-8")
    : "";

  const existingLines = new Set(
    existingContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)
  );

  const toAdd: string[] = [];
  for (const entry of entries) {
    if (!existingLines.has(entry)) {
      toAdd.push(entry);
    }
  }

  if (toAdd.length === 0 && existsSync(gitignorePath)) {
    return { created: false, added: [] };
  }

  const needsTrailingNewline =
    existingContent.length > 0 && !/\n$/.test(existingContent);
  const headerComment = "# Visnap artifacts";
  const prefix =
    existingContent + (needsTrailingNewline ? "\n" : existingContent ? "" : "");

  const block =
    (existingContent ? "\n" : "") +
    headerComment +
    "\n" +
    toAdd.join("\n") +
    "\n";

  writeFileSync(gitignorePath, prefix + block, { encoding: "utf-8" });

  return { created: existingContent === "", added: toAdd };
}
