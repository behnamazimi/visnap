import type { FilterOptions } from "@visnap/protocol";

export type CliOptions = FilterOptions;

export interface GlobalCliOptions {
  config?: string;
  quiet?: boolean;
}
