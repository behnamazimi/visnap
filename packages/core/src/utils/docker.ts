import { spawnSync } from "node:child_process";

import log from "./logger";

export interface DockerRunOptions {
  image: string;
  args: string[];
}

export interface DockerConfigOptions {
  image: string;
  config: unknown;
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
  const { image, command } = options;

  const args: string[] = [command];

  // TODO: create args from config in mature versions

  return runInDocker({ image, args });
};
