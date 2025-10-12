import type { FilterOptions } from "@vividiff/protocol";

export type CliOptions = FilterOptions;

export interface GlobalCliOptions {
  config?: string;
  quiet?: boolean;
}
