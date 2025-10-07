import { existsSync, mkdirSync } from "fs";
import { join } from "path";

import { resolveScreenshotDir } from "@/lib";

export const ensureVttDirectories = (screenshotDir?: string): void => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  const vttDir = join(process.cwd(), effectiveScreenshotDir);
  if (!existsSync(vttDir)) mkdirSync(vttDir);

  const ensure = (name: string) => {
    const dir = join(vttDir, name);
    if (!existsSync(dir)) mkdirSync(dir);
  };

  ensure("base");
  ensure("current");
  ensure("diff");
};

export const getCurrentDir = (screenshotDir?: string): string => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  return join(process.cwd(), effectiveScreenshotDir, "current");
};
export const getBaseDir = (screenshotDir?: string): string => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  return join(process.cwd(), effectiveScreenshotDir, "base");
};
export const getDiffDir = (screenshotDir?: string): string => {
  const effectiveScreenshotDir = resolveScreenshotDir(screenshotDir);
  return join(process.cwd(), effectiveScreenshotDir, "diff");
};
