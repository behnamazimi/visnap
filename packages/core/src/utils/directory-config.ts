/**
 * Configuration for directory structure
 */
export interface DirectoryConfig {
  baseDirName: string;
  currentDirName: string;
  diffDirName: string;
}

/**
 * Default directory configuration
 */
export const DEFAULT_DIRECTORY_CONFIG: DirectoryConfig = {
  baseDirName: "base",
  currentDirName: "current",
  diffDirName: "diff",
};

/**
 * Creates a directory configuration with defaults
 */
export function createDirectoryConfig(
  config?: Partial<DirectoryConfig>
): DirectoryConfig {
  return {
    ...DEFAULT_DIRECTORY_CONFIG,
    ...config,
  };
}

/**
 * Validates directory names for security
 */
export function validateDirectoryName(name: string, context: string): string {
  if (!name || typeof name !== "string") {
    throw new Error(`${context} must be a non-empty string`);
  }

  // Check for path traversal attempts
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    throw new Error(
      `${context} cannot contain path separators or traversal sequences`
    );
  }

  // Check for valid directory name characters
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(
      `${context} must contain only alphanumeric characters, underscores, and hyphens`
    );
  }

  return name;
}

/**
 * Validates entire directory configuration
 */
export function validateDirectoryConfig(
  config: DirectoryConfig
): DirectoryConfig {
  return {
    baseDirName: validateDirectoryName(config.baseDirName, "baseDirName"),
    currentDirName: validateDirectoryName(
      config.currentDirName,
      "currentDirName"
    ),
    diffDirName: validateDirectoryName(config.diffDirName, "diffDirName"),
  };
}
