import { spawnSync } from "node:child_process";

import log from "./logger";

import { type VTTConfig } from "@/lib/config";

export interface DockerRunOptions {
  image: string;
  args: string[];
}

export interface DockerConfigOptions {
  image: string;
  config: VTTConfig;
  command: "test" | "update";
}

export const runInDocker = (options: DockerRunOptions): number => {
  const cwd = process.cwd();
  const dockerArgs = [
    "run",
    "--rm",
    "-i",
    "-v",
    `${cwd}:/app`,
    "-w",
    "/app",
    options.image,
    ...options.args,
  ];

  // log the full command
  log.debug("docker: " + dockerArgs.join(" "));

  const res = spawnSync("docker", dockerArgs, { stdio: "inherit" });

  return res.status ?? 1;
};

export const runInDockerWithConfig = (options: DockerConfigOptions): number => {
  const { image, config, command } = options;

  const args: string[] = [command];

  // Add include patterns
  if (config.include) {
    const includePatterns = Array.isArray(config.include)
      ? config.include
      : [config.include];
    args.push("--include", includePatterns.join(","));
  }

  // Add exclude patterns
  if (config.exclude) {
    const excludePatterns = Array.isArray(config.exclude)
      ? config.exclude
      : [config.exclude];
    args.push("--exclude", excludePatterns.join(","));
  }

  // Add browsers
  if (config.browser) {
    const browsers = Array.isArray(config.browser)
      ? config.browser
      : [config.browser];
    args.push("--browsers", browsers.join(","));
  }

  // Add dry-run flag
  if (config.dryRun) {
    args.push("--dry-run");
  }

  // Add JSON report
  if (config.jsonReport) {
    args.push(
      "--json",
      typeof config.jsonReport === "string" ? config.jsonReport : ""
    );
  }

  return runInDocker({ image, args });
};
