import { minimatch } from "minimatch";

/**
 * Story filtering helpers used to decide which stories to run.
 *
 * Matching rules:
 * - Include then exclude: include defaults to all when omitted; exclude prunes matched stories.
 * - For each pattern, we try to match the Storybook `id` first using minimatch (glob).
 * - If `id` does not match, we try the story `title` using a custom glob-to-RegExp that allows `*` to also match `/`.
 *   This is useful because Storybook titles often contain `/`, e.g. "Example/Button".
 * - Matching is case-sensitive.
 */

export interface StoryLike {
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
 * Creates a predicate that filters stories based on include/exclude patterns.
 *
 * @param cfg.include One or more glob patterns to include (applies to id, then title). When omitted, all are included.
 * @param cfg.exclude One or more glob patterns to exclude (applies to id, then title) after include phase.
 * @returns A predicate function: (story) => boolean
 */
export const createStoryFilter = (config: FilterConfig) => {
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

  return (story: StoryLike): boolean => {
    const matchInclude = (patterns: string[]) =>
      matchesAnyPattern(story.id, patterns) ||
      matchTitleGlob(story.title, patterns);

    const included = include.length === 0 ? true : matchInclude(include);
    if (!included) return false;

    const excluded =
      exclude.length > 0 &&
      (matchesAnyPattern(story.id, exclude) ||
        matchTitleGlob(story.title, exclude));
    if (excluded) return false;

    return true;
  };
};
