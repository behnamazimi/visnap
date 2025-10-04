import {
  createConcurrencyPool,
  resolveConcurrency,
  createStoryFilter,
  launchBrowser,
  openPage,
  type VTTConfig,
  type BrowserName,
} from "../lib";
import type { VTTStory } from "../types";

import type { ParsedArgs } from "./args";
import { resolveStoryConfig, shouldProcessStoryForBrowser } from "./config-resolver";
import { log } from "./logger";
import { globalBrowserManager } from "./resource-cleanup";
import { screenshotStoryWithViewports } from "./screenshot-utils";
import {
  extractStories,
  normalizeStories,
  waitForStorybookReady,
} from "./story-utils";

export interface RunOptions {
  mode: "test" | "update";
  sbUrl: string;
  browser: BrowserName;
  config: VTTConfig;
  args?: ParsedArgs;
}

export const runStoriesOnBrowser = async (
  options: RunOptions
): Promise<{ total: number; processed: number; listed: number }> => {
  const { mode, sbUrl, browser, config, args } = options;
  const browserInstance = await launchBrowser(browser);
  const bootstrapPage = await openPage(browserInstance, sbUrl);
  await waitForStorybookReady(bootstrapPage);
  const rawStories = await extractStories(bootstrapPage);
  const stories = normalizeStories(rawStories);
  await bootstrapPage.close();

  const concurrency = resolveConcurrency(config);
  let processed = 0;

  const storyFilter = createStoryFilter({
    include: config.include,
    exclude: config.exclude,
  });

  // Filter stories using clean config resolver pattern
  const candidates = stories
    .filter(s => !s.visualTesting.skip)
    .filter(storyFilter)
    .filter(s => shouldProcessStoryForBrowser(s, browser, config));
  const total = candidates.length;

  if (args?.dryRun) {
    log.info(`[${browser}] Dry-run: ${total} stories would be processed`);
    for (const s of candidates) {
      log.dim(` - ${s.id}`);
    }
    await browserInstance.close();
    return { total, processed: 0, listed: total };
  }

  const runWithPool = createConcurrencyPool({ concurrency });
  await runWithPool(candidates, async (story: VTTStory) => {
    const resolvedConfig = resolveStoryConfig(story, config);

    await screenshotStoryWithViewports({
      mode,
      sbUrl,
      browserName: browser,
      browser: browserInstance,
      config,
      story,
      resolvedConfig,
    });
    
    if (resolvedConfig.viewport) {
      processed += Object.keys(resolvedConfig.viewport).length;
    } else {
      processed += 1;
    }
  });

  // Explicitly close browser when done
  await browserInstance.close();
  globalBrowserManager.removeBrowser(browserInstance);
  log.success(`Took screenshots for ${processed} stories on ${browser}`);
  return { total, processed, listed: 0 };
};