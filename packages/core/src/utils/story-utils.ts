import { type Page } from "playwright-core";

import { type ViewportConfig, type BrowserName } from "@/lib";
import { type VTTStory } from "@/types";

declare global {
  interface Window {
    __STORYBOOK_PREVIEW__: {
      ready(): Promise<void>;
      extract(): Promise<Record<string, unknown>>;
    };
  }
}

export const waitForStorybookReady = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => window.__STORYBOOK_PREVIEW__, null, {
    timeout: 10000,
  });
  await page.evaluate(async () => {
    const storybook = window.__STORYBOOK_PREVIEW__;
    if (storybook) {
      await storybook.ready();
    }
  });
};

export const extractStories = async (
  page: Page
): Promise<Record<string, unknown>> => {
  return await page.evaluate(async () => {
    const storybook = window.__STORYBOOK_PREVIEW__;
    return await storybook.extract();
  });
};

export const normalizeStories = (
  stories: Record<string, unknown>
): VTTStory[] => {
  return Object.values(stories).map((story: unknown) => {
    const storyObj = story as {
      id: string;
      title: string;
      kind: string;
      parameters?: {
        visualTesting?: {
          skip?: boolean;
          screenshotTarget?: string;
          threshold?: number;
          browser?: BrowserName | BrowserName[];
          viewport?: ViewportConfig;
        };
      };
    };
    const visualTesting = storyObj.parameters?.visualTesting || {};
    return {
      id: storyObj.id,
      title: storyObj.title,
      kind: storyObj.kind,
      visualTesting: {
        skip: visualTesting.skip ?? false,
        screenshotTarget: visualTesting.screenshotTarget,
        threshold: visualTesting.threshold,
        browser: visualTesting.browser,
        viewport: visualTesting.viewport,
      },
    };
  });
};

export const resolveScreenshotSelector = (target?: string): string => {
  if (!target || target === "story-root") return "#storybook-root";
  if (target === "body") return "body";
  return target;
};

/**
 * Normalize a value to a string array, handling both string and string[] inputs
 */
export const normalizeToStringArray = (value?: string | string[]): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};
