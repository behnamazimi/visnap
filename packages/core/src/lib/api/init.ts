import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

import {
  generateConfigContent,
  generateGitignoreContent,
} from "../../utils/config-generator";
import { resolveScreenshotDir } from "../config";

export interface InitOptions {
  /** Config file type */
  configType?: "ts" | "js";
  /** Browsers to include */
  browsers?: string[];
  /** Storybook source path */
  storybookSource?: string;
  /** Concurrency level */
  concurrency?: number;
  /** Pixel difference threshold */
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
  const {
    configType = "ts",
    browsers = ["chromium"],
    storybookSource = "./storybook-static",
    concurrency = 4,
    threshold = 0.1,
  } = options;

  const configContent = generateConfigContent({
    configType,
    browsers,
    storybookSource,
    concurrency,
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
      browsers,
      storybookSource,
      concurrency,
      threshold,
    },
  };
}
