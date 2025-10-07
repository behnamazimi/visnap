import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

import { resolveScreenshotDir } from "@/lib/config";
import {
  generateConfigContent,
  generateGitignoreContent,
} from "@/utils/config-generator";

export interface InitOptions {
  /** Config file type */
  configType?: "ts" | "js";
  threshold?: number;
}

interface BaseResult {
  /** Whether operation completed successfully */
  success: boolean;
}

export interface InitResult extends BaseResult {
  /** Path to created config file */
  configPath: string;
  /** Configuration options used */
  options: InitOptions;
}

/**
 * Initialize a new project with configuration
 */
export async function initializeProject(
  options: InitOptions = {}
): Promise<InitResult> {
  const { configType = "ts", threshold = 0.1 } = options;

  const configContent = generateConfigContent({
    configType,
    threshold,
  });

  const configFileName = `vtt.config.${configType}`;
  const configPath = join(process.cwd(), configFileName);

  // Check if config file already exists
  if (existsSync(configPath)) {
    throw new Error(
      `${configFileName} already exists in the current directory.`
    );
  }

  // Write the config file
  writeFileSync(configPath, configContent);

  // Create .gitignore for screenshot directories
  const screenshotDir = resolveScreenshotDir();
  const screenshotDirPath = join(process.cwd(), screenshotDir);
  const gitignorePath = join(screenshotDirPath, ".gitignore");
  const gitignoreContent = generateGitignoreContent();

  // Ensure screenshot directory exists
  if (!existsSync(screenshotDirPath)) {
    mkdirSync(screenshotDirPath, { recursive: true });
  }

  // Create .gitignore in the screenshot directory
  writeFileSync(gitignorePath, gitignoreContent);

  return {
    success: true,
    configPath,
    options: {
      configType,
      threshold,
    },
  };
}
