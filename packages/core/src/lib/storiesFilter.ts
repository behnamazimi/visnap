import { minimatch } from "minimatch";

/**
 * Test case filtering helpers used to decide which test cases to run.
 *
 * Matching rules:
 * - Include then exclude: include defaults to all when omitted; exclude prunes matched test cases.
 * - For each pattern, we try to match the test case `id` first using minimatch patterns.
 * - If `id` does not match, we try the test case `title` using a custom pattern that allows `*` to also match `/`.
 *   This is useful because test case titles may contain `/`, e.g. "Example/Button".
 * - Matching is case-sensitive.
 */

export interface TestCaseLike {
  id: string;
  title: string;
}

const normalizeToStringArray = (value?: string | string[]): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export interface FilterConfig {
  include?: string | string[];
  exclude?: string | string[];
}

/**
 * Creates a predicate that filters test cases based on include/exclude patterns.
 *
 * @param cfg.include One or more minimatch patterns to include (applies to id, then title). When omitted, all are included.
 * @param cfg.exclude One or more minimatch patterns to exclude (applies to id, then title) after include phase.
 * @returns A predicate function: (testCase) => boolean
 */
export const createTestCaseFilter = (config: FilterConfig) => {
  const include = normalizeToStringArray(config.include);
  const exclude = normalizeToStringArray(config.exclude);

  const matchesAnyPattern = (value: string, patterns: string[]): boolean => {
    for (const pattern of patterns) {
      if (minimatch(value, pattern, { nocase: false })) return true;
    }
    return false;
  };

  /**
   * Convert a glob to a RegExp where `*` is greedy and matches across path separators (including `/`).
   * This differs from strict path-style globs and is intended for Storybook titles.
   */
  const globToRegex = (pattern: string): RegExp => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regexSrc =
      "^" + escaped.replace(/\*/g, ".*").replace(/\?/g, ".") + "$";
    return new RegExp(regexSrc);
  };

  /** Try title matching using the relaxed glob (supports `/`). */
  const matchTitleGlob = (title: string, patterns: string[]): boolean => {
    for (const pattern of patterns) {
      const regex = globToRegex(pattern);
      if (regex.test(title)) return true;
    }
    return false;
  };

  return (testCase: TestCaseLike): boolean => {
    const matchInclude = (patterns: string[]) =>
      matchesAnyPattern(testCase.id, patterns) ||
      matchTitleGlob(testCase.title, patterns);

    const included = include.length === 0 ? true : matchInclude(include);
    if (!included) return false;

    const excluded =
      exclude.length > 0 &&
      (matchesAnyPattern(testCase.id, exclude) ||
        matchTitleGlob(testCase.title, exclude));
    if (excluded) return false;

    return true;
  };
};
