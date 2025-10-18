import type {
  TestCaseMeta,
  TestCaseInstanceMeta,
  ViewportMap,
  BrowserName,
  Viewport,
  FilterOptions,
} from "@visnap/protocol";
import { minimatch } from "minimatch";

/**
 * Story filtering and normalization for Storybook adapter
 */

/**
 * Creates a predicate function that filters stories by include and exclude patterns
 * Patterns support minimatch wildcards. Invalid patterns are ignored.
 *
 * @param options - Filter options with include and exclude patterns
 * @returns Predicate function that returns true if story should be included
 *
 */
export function createTestCaseFilter(options: FilterOptions) {
  const includePatterns = Array.isArray(options.include)
    ? options.include
    : options.include
      ? [options.include]
      : [];
  const excludePatterns = Array.isArray(options.exclude)
    ? options.exclude
    : options.exclude
      ? [options.exclude]
      : [];

  return (story: TestCaseMeta) => {
    const storyId = story.id;

    // Check include patterns
    if (includePatterns.length > 0) {
      const matchesInclude = includePatterns.some((pattern: string) =>
        minimatch(storyId, pattern)
      );
      if (!matchesInclude) return false;
    }

    // Check exclude patterns
    if (excludePatterns.length > 0) {
      const matchesExclude = excludePatterns.some((pattern: string) =>
        minimatch(storyId, pattern)
      );
      if (matchesExclude) return false;
    }

    return true;
  };
}

/**
 * Normalizes and expands raw Storybook `extract()` output into TestCaseInstanceMeta[].
 * Applies runtime guards, include/exclude filtering, skip handling, and case-level config.
 */
export function normalizeStories(
  stories: Record<string, unknown>,
  options: FilterOptions & {
    baseUrl: string;
    viewportKeys: string[];
    globalViewport?: ViewportMap;
  }
): TestCaseInstanceMeta[] {
  const metas: TestCaseMeta[] = [];
  const currentBaseUrl = options.baseUrl.replace(/\/$/, "");

  for (const raw of Object.values(stories)) {
    if (!raw || typeof raw !== "object") continue;
    const storyObj = raw as TestCaseMeta;

    const id = typeof storyObj.id === "string" ? storyObj.id : undefined;
    const title =
      typeof storyObj.title === "string" ? storyObj.title : (id ?? "");
    if (!id) continue;

    // Get visualTesting under parameters.visualTesting, fallback to empty object
    const parameters = storyObj as { parameters?: { visualTesting?: unknown } };
    const vt =
      parameters.parameters &&
      typeof parameters.parameters.visualTesting === "object" &&
      parameters.parameters.visualTesting !== null
        ? (parameters.parameters.visualTesting as Record<string, unknown>)
        : {};

    const skip = typeof vt.skip === "boolean" ? vt.skip : false;
    const screenshotTarget =
      typeof vt.screenshotTarget === "string" ? vt.screenshotTarget : undefined;
    const threshold =
      typeof vt.threshold === "number" ? vt.threshold : undefined;
    const browser =
      Array.isArray(vt.browser) || typeof vt.browser === "string"
        ? (vt.browser as BrowserName | BrowserName[])
        : undefined;
    const viewport =
      typeof vt.viewport === "object" && vt.viewport !== null
        ? (vt.viewport as Viewport)
        : undefined;
    const disableCSSInjection =
      typeof vt.disableCSSInjection === "boolean"
        ? vt.disableCSSInjection
        : undefined;
    const interactions = Array.isArray(vt.interactions)
      ? vt.interactions
      : undefined;
    const elementsToMask = Array.isArray(vt.elementsToMask)
      ? vt.elementsToMask
      : undefined;

    metas.push({
      id,
      title,
      kind: "story",
      visualTesting: {
        skip,
        screenshotTarget,
        threshold,
        browser,
        viewport,
        disableCSSInjection,
        interactions,
        elementsToMask,
      },
    });
  }

  // Build filter predicate from include/exclude
  const filter = createTestCaseFilter({
    include: options.include,
    exclude: options.exclude,
  });
  const filtered = metas
    .filter(story => !story.visualTesting?.skip)
    .filter(filter);

  const instances: TestCaseInstanceMeta[] = [];
  for (const story of filtered) {
    const visualConfig = story.visualTesting;
    for (const viewportKey of options.viewportKeys) {
      // Use global viewport configuration as fallback if individual test case doesn't have viewport config
      const viewportConfig =
        visualConfig?.viewport || options.globalViewport?.[viewportKey];

      instances.push({
        id: story.id,
        title: story.title,
        kind: "story",
        caseId: story.id,
        variantId: viewportKey,
        url: `${currentBaseUrl}/iframe.html?id=${encodeURIComponent(story.id)}`,
        screenshotTarget: visualConfig?.screenshotTarget ?? "#storybook-root",
        viewport: viewportConfig,
        threshold: visualConfig?.threshold,
        disableCSSInjection: visualConfig?.disableCSSInjection,
        interactions: visualConfig?.interactions,
        elementsToMask: visualConfig?.elementsToMask,
      });
    }
  }
  return instances;
}
