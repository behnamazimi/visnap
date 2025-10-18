import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import {
  createDirectoryConfig,
  validateDirectoryConfig,
  type DirectoryConfig,
} from "./directory-config";
import { validateScreenshotDir } from "./path-validation";

import { resolveScreenshotDir } from "@/lib/config";

export const ensureViSnapDirectories = (
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

  const visnapDir = join(process.cwd(), effectiveScreenshotDir);
  if (!existsSync(visnapDir)) mkdirSync(visnapDir);

  const ensureDirectoryExists = (name: string) => {
    const dir = join(visnapDir, name);
    if (!existsSync(dir)) mkdirSync(dir);
  };

  ensureDirectoryExists(dirConfig.baseDirName);
  ensureDirectoryExists(dirConfig.currentDirName);
  ensureDirectoryExists(dirConfig.diffDirName);
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
