import type { FilterOptions } from "@visnap/protocol";

export interface ParsedArgs extends Pick<FilterOptions, "include" | "exclude"> {
  include?: string[];
  exclude?: string[];
  json?: string | boolean;
  dryRun?: boolean;
}

const splitArg = (v?: string): string[] | undefined => {
  if (!v) return undefined;
  return v
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
};

export const parseIncludeExclude = (argv: string[]): ParsedArgs => {
  // simple manual parse for --include and --exclude; supports repeated or comma-separated
  const out: ParsedArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--include") {
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        const parts = splitArg(value) ?? [];
        out.include = [...(out.include ?? []), ...parts];
        i++;
      }
      continue;
    }
    if (token === "--exclude") {
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        const parts = splitArg(value) ?? [];
        out.exclude = [...(out.exclude ?? []), ...parts];
        i++;
      }
      continue;
    }
    if (token === "--json") {
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        out.json = value;
        i++;
      } else {
        out.json = true;
      }
      continue;
    }
    if (token === "--dry-run") {
      out.dryRun = true;
      continue;
    }
  }
  return out;
};
