import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import {
  createDirectoryConfig,
  validateDirectoryConfig,
  type DirectoryConfig,
} from "./directory-config";
import { validateScreenshotDir } from "./path-validation";

import { resolveScreenshotDir } from "@/lib/config";

export const ensureVttDirectories = (
  screenshotDir?: string,
  directoryConfig?: Partial<DirectoryConfig>
): void => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);

  // Validate screenshot directory path for security
  validateScreenshotDir(effectiveScreenshotDir);

  // Create and validate directory configuration
  const dirConfig = validateDirectoryConfig(
    createDirectoryConfig(directoryConfig)
  );

  const vttDir = join(process.cwd(), effectiveScreenshotDir);
  if (!existsSync(vttDir)) mkdirSync(vttDir);

  const ensure = (name: string) => {
    const dir = join(vttDir, name);
    if (!existsSync(dir)) mkdirSync(dir);
  };

  ensure(dirConfig.baseDirName);
  ensure(dirConfig.currentDirName);
  ensure(dirConfig.diffDirName);
};

export const getCurrentDir = (
  screenshotDir?: string,
  directoryConfig?: Partial<DirectoryConfig>
): string => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  const dirConfig = createDirectoryConfig(directoryConfig);
  return join(process.cwd(), effectiveScreenshotDir, dirConfig.currentDirName);
};

export const getBaseDir = (
  screenshotDir?: string,
  directoryConfig?: Partial<DirectoryConfig>
): string => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  const dirConfig = createDirectoryConfig(directoryConfig);
  return join(process.cwd(), effectiveScreenshotDir, dirConfig.baseDirName);
};

export const getDiffDir = (
  screenshotDir?: string,
  directoryConfig?: Partial<DirectoryConfig>
): string => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  const dirConfig = createDirectoryConfig(directoryConfig);
  return join(process.cwd(), effectiveScreenshotDir, dirConfig.diffDirName);
};
