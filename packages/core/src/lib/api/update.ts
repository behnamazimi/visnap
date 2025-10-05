import { DEFAULT_DOCKER_IMAGE } from "@/constants";
import {
  resolveBrowsers,
  resolveFinalConfig,
  type BrowserName,
  type ViewportConfig,
} from "@/lib/config";
import { runInDockerWithConfig } from "@/utils/docker";
import { ensureVttDirectories } from "@/utils/fs";
import log from "@/utils/logger";
import { getStorybookUrl } from "@/utils/server";
import { runStoriesOnBrowser } from "@/utils/story-runner";

// High-level API types
interface BaseOptions {
  /** Include patterns for stories (overrides config) */
  include?: string[];
  /** Exclude patterns for stories (overrides config) */
  exclude?: string[];
  /** Browsers to test (overrides config) */
  browsers?: BrowserName[];
  /** Viewport configuration (overrides config) */
  viewport?: ViewportConfig;
  /** Dry run - don't take screenshots */
  dryRun?: boolean;
  /** Use Docker for execution */
  useDocker?: boolean;
  /** Output JSON report to file */
  jsonReport?: string | boolean;
}

export type UpdateOptions = BaseOptions;

interface BaseResult {
  /** Whether operation completed successfully */
  success: boolean;
}

export interface UpdateResult extends BaseResult {
  /** Browsers processed */
  browsers: string[];
  /** Total test cases updated */
  totalTestCases: number;
}

/**
 * Update baseline screenshots
 */
export async function updateBaseline(
  options: UpdateOptions = {}
): Promise<UpdateResult> {
  const {
    include,
    exclude,
    browsers,
    viewport,
    useDocker = false,
    jsonReport,
  } = options;

  // Resolve final configuration (config file → process args → function options)
  const effectiveConfig = await resolveFinalConfig({
    include,
    exclude,
    browser: browsers,
    viewport,
    jsonReport,
    useDocker,
  });

  // Handle Docker execution
  if (effectiveConfig.useDocker) {
    const status = runInDockerWithConfig({
      image: process.env.VTT_DOCKER_IMAGE || DEFAULT_DOCKER_IMAGE,
      config: effectiveConfig,
      command: "update",
    });

    return {
      success: status === 0,
      browsers: browsers || [],
      totalTestCases: 0,
    };
  }

  log.success("Successfully loaded visual-testing-tool.config");

  // Start Storybook server
  const sb = await getStorybookUrl();
  if (!sb) {
    throw new Error("Failed to serve storybook build output");
  }

  log.info(`Storybook ready at ${sb.url}`);

  // Prepare directories
  ensureVttDirectories(effectiveConfig);

  const updateBrowsers: BrowserName[] =
    browsers || resolveBrowsers(effectiveConfig);
  let totalTestCases = 0;

  // Process each browser
  for (const browserName of updateBrowsers) {
    await runStoriesOnBrowser({
      mode: "update",
      sbUrl: sb.url,
      browser: browserName,
      config: effectiveConfig,
    });
    totalTestCases++; // This is a simplified count
  }

  // Cleanup
  if (sb.server) sb.server.close();

  return {
    success: true,
    browsers: updateBrowsers,
    totalTestCases,
  };
}
