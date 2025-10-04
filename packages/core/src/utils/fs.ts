import { existsSync, mkdirSync, promises as fs } from "fs";
import { join } from "path";

import { resolveScreenshotDir, type VTTConfig } from "../lib";

import { getErrorMessage } from "./error-handler";
import { validateSafePath } from "./validation";

export const ensureVttDirectories = (config?: VTTConfig): void => {
  const screenshotDir = resolveScreenshotDir(config);
  const vttDir = join(process.cwd(), screenshotDir);
  if (!existsSync(vttDir)) mkdirSync(vttDir);

  const ensure = (name: string) => {
    const dir = join(vttDir, name);
    if (!existsSync(dir)) mkdirSync(dir);
  };

  ensure("base");
  ensure("current");
  ensure("diff");
};

export const clearDirectoryFiles = async (dirPath: string): Promise<void> => {
  if (!existsSync(dirPath)) return;

  try {
    const files = await fs.readdir(dirPath);
    await Promise.all(
      files.map(file => {
        const filePath = join(dirPath, file);
        if (!validateSafePath(filePath)) {
          throw new Error(`Unsafe file path: ${filePath}`);
        }
        return fs.unlink(filePath);
      })
    );
  } catch (error) {
    throw new Error(
      `Failed to clear directory ${dirPath}: ${getErrorMessage(error)}`
    );
  }
};

export const getCurrentDir = (config?: VTTConfig): string => {
  const screenshotDir = resolveScreenshotDir(config);
  return join(process.cwd(), screenshotDir, "current");
};
export const getBaseDir = (config?: VTTConfig): string => {
  const screenshotDir = resolveScreenshotDir(config);
  return join(process.cwd(), screenshotDir, "base");
};
export const getDiffDir = (config?: VTTConfig): string => {
  const screenshotDir = resolveScreenshotDir(config);
  return join(process.cwd(), screenshotDir, "diff");
};
