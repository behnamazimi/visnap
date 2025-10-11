export interface CliOptions {
  include?: string | string[];
  exclude?: string | string[];
}

export interface GlobalCliOptions {
  config?: string;
  quiet?: boolean;
}
