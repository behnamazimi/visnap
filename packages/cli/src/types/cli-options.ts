export interface CliOptions {
  include?: string | string[];
  exclude?: string | string[];
}

export interface GlobalCliOptions {
  config?: string;
  verbose?: boolean;
  quiet?: boolean;
  noColor?: boolean;
}
