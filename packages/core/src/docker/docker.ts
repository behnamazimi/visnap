import { spawn } from "node:child_process";

import log from "@/utils/logger";

export interface DockerRunOptions {
  image: string;
  args: string[];
}

export interface DockerConfigOptions {
  image: string;
  config: unknown;
  command: "test" | "update";
}

export const runInDocker = async (
  options: DockerRunOptions
): Promise<number> => {
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

  return new Promise(resolve => {
    const child = spawn("docker", dockerArgs, { stdio: "inherit" });

    child.on("close", code => {
      resolve(code ?? 1);
    });

    child.on("error", error => {
      log.error(`Docker process error: ${error.message}`);
      resolve(1);
    });
  });
};

export const runInDockerWithConfig = async (
  options: DockerConfigOptions
): Promise<number> => {
  const { image, command } = options;

  const args: string[] = [command];

  // TODO: create args from config in mature versions

  return await runInDocker({ image, args });
};
