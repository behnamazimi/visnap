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
 * Creates a predicate function that filters stories by `include` and `exclude` patterns.
 * Patterns support minimatch wildcards. Invalid patterns are ignored.
 */
export function createTestCaseFilter(opts: FilterOptions) {
  const includePatterns = Array.isArray(opts.include)
    ? opts.include
    : opts.include
      ? [opts.include]
      : [];
  const excludePatterns = Array.isArray(opts.exclude)
    ? opts.exclude
    : opts.exclude
      ? [opts.exclude]
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
  const filtered = metas.filter(s => !s.visualTesting?.skip).filter(filter);

  const instances: TestCaseInstanceMeta[] = [];
  for (const s of filtered) {
    const cfg = s.visualTesting;
    for (const vk of options.viewportKeys) {
      // Use global viewport configuration as fallback if individual test case doesn't have viewport config
      const viewportConfig = cfg?.viewport || options.globalViewport?.[vk];

      instances.push({
        id: s.id,
        title: s.title,
        kind: "story",
        caseId: s.id,
        variantId: vk,
        url: `${currentBaseUrl}/iframe.html?id=${encodeURIComponent(s.id)}`,
        screenshotTarget: cfg?.screenshotTarget ?? "#storybook-root",
        viewport: viewportConfig,
        threshold: cfg?.threshold,
        disableCSSInjection: cfg?.disableCSSInjection,
        interactions: cfg?.interactions,
        elementsToMask: cfg?.elementsToMask,
      });
    }
  }
  return instances;
}
