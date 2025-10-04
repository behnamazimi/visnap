import { readdirSync } from "fs";
import { join } from "path";

import odiff from "odiff-bin";

import { type VTTConfig } from "./config";

import { DEFAULT_THRESHOLD } from "@/constants";
import { type VTTStory } from "@/types";
import { type ResolvedStoryConfig } from "@/utils/config-resolver";
import { getErrorMessage } from "@/utils/error-handler";

export interface CompareOptions {
  threshold?: number;
  diffColor?: string;
}

export interface CompareResult {
  id: string;
  match: boolean;
  reason: string;
  diffPercentage?: number;
}

export const compareDirectories = async (
  currentDir: string,
  baseDir: string,
  diffDir: string,
  options: CompareOptions = {}
): Promise<CompareResult[]> => {
  const files = readdirSync(currentDir);
  const threshold =
    typeof options.threshold === "number"
      ? options.threshold
      : DEFAULT_THRESHOLD;
  const diffColor = options.diffColor ?? "#00ff00";

  const results: CompareResult[] = [];
  for (const file of files) {
    const currentFile = join(currentDir, file);
    const baseFile = join(baseDir, file);
    const diffFile = join(diffDir, file);
    try {
      const diffResult = await odiff.compare(currentFile, baseFile, diffFile, {
        diffColor,
        threshold,
      });
      if (diffResult.match) {
        results.push({ id: file, match: true, reason: "", diffPercentage: 0 });
      } else if (diffResult.reason === "pixel-diff") {
        results.push({
          id: file,
          match: false,
          reason: diffResult.reason,
          diffPercentage: diffResult.diffPercentage,
        });
      } else {
        results.push({
          id: file,
          match: false,
          reason: diffResult.reason,
          diffPercentage: 0,
        });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const baseNotFound = message.match(
        /Could not load comparison image: (.*)/
      );
      results.push({
        id: file,
        match: false,
        reason: baseNotFound ? "base does not exist" : message,
      });
    }
  }

  return results;
};

/**
 * Compare base and current screenshots with story-level configuration support.
 * This function can handle different thresholds per story.
 */
export const compareBaseAndCurrentWithStories = async (
  config: VTTConfig,
  stories: VTTStory[],
  resolvedConfigs: Map<string, ResolvedStoryConfig>
): Promise<CompareResult[]> => {
  const { getCurrentDir, getBaseDir, getDiffDir } = await import("@/utils/fs");

  const currentDir = getCurrentDir(config);
  const baseDir = getBaseDir(config);
  const diffDir = getDiffDir(config);

  const files = readdirSync(currentDir);
  const results: CompareResult[] = [];

  // Create a map of story ID to story config for quick lookup
  const storyMap = new Map<string, VTTStory>();
  stories.forEach(story => {
    storyMap.set(story.id, story);
  });

  for (const file of files) {
    const currentFile = join(currentDir, file);
    const baseFile = join(baseDir, file);
    const diffFile = join(diffDir, file);

    // Extract story ID and browser from filename (format: storyId--browser.png)
    const match = file.match(/^(.+)--(.+)\.png$/);
    if (!match) {
      results.push({
        id: file,
        match: false,
        reason: "Invalid filename format",
      });
      continue;
    }

    const [, storyId] = match;
    const story = storyMap.get(storyId);

    // Get threshold for this specific story from resolved configs
    const threshold = story
      ? (resolvedConfigs.get(storyId)?.threshold ??
        config.threshold ??
        DEFAULT_THRESHOLD)
      : (config.threshold ?? DEFAULT_THRESHOLD);

    try {
      const diffResult = await odiff.compare(currentFile, baseFile, diffFile, {
        diffColor: "#00ff00",
        threshold,
      });

      if (diffResult.match) {
        results.push({ id: file, match: true, reason: "", diffPercentage: 0 });
      } else if (diffResult.reason === "pixel-diff") {
        results.push({
          id: file,
          match: false,
          reason: diffResult.reason,
          diffPercentage: diffResult.diffPercentage,
        });
      } else {
        results.push({
          id: file,
          match: false,
          reason: diffResult.reason,
          diffPercentage: 0,
        });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      const baseNotFound = message.match(
        /Could not load comparison image: (.*)/
      );
      results.push({
        id: file,
        match: false,
        reason: baseNotFound ? "base does not exist" : message,
      });
    }
  }

  return results;
};
