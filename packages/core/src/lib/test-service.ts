import { compareBaseAndCurrentWithStories } from "./compare";
import { type CompareResult } from "./compare";
import { type VTTConfig, type BrowserName } from "./config";
import { createTestCaseFilter } from "./storiesFilter";

import { type VTTStory } from "@/types";
import {
  shouldProcessStoryForBrowser,
  resolveStoryConfig,
  type ResolvedStoryConfig,
} from "@/utils/config-resolver";
import log from "@/utils/logger";
import { runStoriesOnBrowser } from "@/utils/story-runner";

export interface BrowserTestResult {
  /** Browser name */
  browser: string;
  /** Stories that passed */
  passed: number;
  /** Total stories tested */
  total: number;
  /** Individual story results */
  results: CompareResult[];
}

export interface ProcessBrowserOptions {
  include?: string[];
  exclude?: string[];
  dryRun?: boolean;
}

/**
 * Process a single browser for testing
 */
export async function processBrowserForTest(
  browserName: BrowserName,
  sbUrl: string,
  config: VTTConfig,
  allStories: VTTStory[],
  options: ProcessBrowserOptions
): Promise<BrowserTestResult> {
  const { include: _include, exclude: _exclude, dryRun: _dryRun } = options;

  // Run stories on browser
  await runStoriesOnBrowser({
    mode: "test",
    sbUrl,
    browser: browserName,
    config,
  });

  // Filter stories for this specific browser
  const testCaseFilter = createTestCaseFilter({
    include: config.include,
    exclude: config.exclude,
  });

  const storiesForBrowser = allStories
    .filter(s => !s.visualTesting.skip)
    .filter(testCaseFilter)
    .filter(s => shouldProcessStoryForBrowser(s, browserName, config));

  // Create resolved configs map for the stories
  const resolvedConfigs = new Map<string, ResolvedStoryConfig>();
  storiesForBrowser.forEach(story => {
    resolvedConfigs.set(story.id, resolveStoryConfig(story, config));
  });

  const results = await compareBaseAndCurrentWithStories(
    config,
    storiesForBrowser,
    resolvedConfigs
  );

  const passed = results.filter(r => r.match).length;

  // Log results for each story
  for (const r of results) {
    if (r.match) {
      log.success(`Passed: [${browserName}] ${r.id}`);
    } else {
      const reasonText = r.diffPercentage
        ? `${r.reason} (${r.diffPercentage}% difference)`
        : r.reason;
      log.error(`Failed: [${browserName}] ${r.id} >> ${reasonText}`);
    }
  }

  return {
    browser: browserName,
    passed,
    total: results.length,
    results,
  };
}
