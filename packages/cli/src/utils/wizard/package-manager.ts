/**
 * @fileoverview Package manager detection and installation utilities
 */

import { existsSync } from "fs";

import { createSpinner } from "../spinner";

export interface PackageManager {
  name: "npm" | "yarn" | "pnpm";
  installCommand: string;
}

/**
 * Detect package manager from lock files
 */
export function detectPackageManager(): PackageManager {
  if (existsSync("pnpm-lock.yaml")) {
    return { name: "pnpm", installCommand: "pnpm add" };
  }
  if (existsSync("yarn.lock")) {
    return { name: "yarn", installCommand: "yarn add" };
  }
  return { name: "npm", installCommand: "npm install" };
}

/**
 * Check if a package is installed
 */
export function isPackageInstalled(packageName: string): boolean {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Install missing packages as dev dependencies
 */
export async function installPackages(
  packages: string[],
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner();

  try {
    spinner.start(`Installing ${packages.join(", ")} as dev dependencies...`);

    const { execSync } = await import("child_process");

    const command = `${packageManager.installCommand} -D ${packages.join(" ")}`;

    execSync(command, { stdio: "pipe" });

    spinner.succeed(
      `Successfully installed ${packages.join(", ")} as dev dependencies`
    );
  } catch (error) {
    spinner.fail("Failed to install packages");
    throw error;
  }
}
