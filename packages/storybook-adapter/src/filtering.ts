import type {
  TestCaseMeta,
  TestCaseInstanceMeta,
  ViewportMap,
  BrowserName,
  Viewport,
} from "@visual-testing-tool/protocol";
import { toSafeRegex } from "./utils.js";

/**
 * Story filtering and normalization for Storybook adapter
 */

/**
 * Creates a predicate function that filters stories by `include` and `exclude` patterns.
 * Patterns support `*` wildcard. Invalid patterns are ignored.
 */
export function createTestCaseFilter(opts: {
  include?: string | string[];
  exclude?: string | string[];
}) {
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

  const includeRegexes = includePatterns
    .map(p => {
      const r = toSafeRegex(p);
      if (!r) console.warn(`[storybook-adapter] Ignoring invalid include pattern: ${p}`);
      return r;
    })
    .filter((r): r is RegExp => !!r);
  const excludeRegexes = excludePatterns
    .map(p => {
      const r = toSafeRegex(p);
      if (!r) console.warn(`[storybook-adapter] Ignoring invalid exclude pattern: ${p}`);
      return r;
    })
    .filter((r): r is RegExp => !!r);

  return (story: TestCaseMeta) => {
    const storyId = story.id;

    // Check include patterns
    if (includeRegexes.length > 0) {
      const matchesInclude = includeRegexes.some(regex =>
        regex.test(storyId)
      );
      if (!matchesInclude) return false;
    }

    // Check exclude patterns
    if (excludeRegexes.length > 0) {
      const matchesExclude = excludeRegexes.some(regex =>
        regex.test(storyId)
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
  options: {
    include?: string | string[];
    exclude?: string | string[];
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

    const vt = storyObj.visualTesting ?? {};
    const skip = typeof vt.skip === "boolean" ? vt.skip : false;
    const screenshotTarget =
      typeof vt.screenshotTarget === "string"
        ? vt.screenshotTarget
        : undefined;
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

    metas.push({
      id,
      title,
      visualTesting: { skip, screenshotTarget, threshold, browser, viewport },
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
        caseId: s.id,
        variantId: vk,
        url: `${currentBaseUrl}/iframe.html?id=${encodeURIComponent(s.id)}`,
        screenshotTarget: cfg?.screenshotTarget ?? "#storybook-root",
        viewport: viewportConfig,
        threshold: cfg?.threshold,
      });
    }
  }
  return instances;
}
