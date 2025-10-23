/**
 * @fileoverview Package manager detection and installation utilities
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

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
 * Check if a package is installed locally in the project
 * Verifies both package.json devDependencies and node_modules existence
 * Handles both regular projects and monorepo workspaces
 */
export async function isPackageInstalled(
  packageName: string
): Promise<boolean> {
  try {
    // Check 1: Verify package exists in package.json devDependencies
    const packageJsonPath = join(process.cwd(), "package.json");
    if (!existsSync(packageJsonPath)) {
      return false;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const devDeps = packageJson.devDependencies || {};

    if (!devDeps[packageName]) {
      return false;
    }

    // Check 2: Verify package directory exists in node_modules
    // First try local node_modules, then check workspace root
    let packageDir = join(process.cwd(), "node_modules", packageName);
    let packagePackageJson = join(packageDir, "package.json");

    if (!existsSync(packageDir) || !existsSync(packagePackageJson)) {
      // Try workspace root node_modules (for monorepos)
      const workspaceRoot = findWorkspaceRoot(process.cwd());
      if (workspaceRoot) {
        packageDir = join(workspaceRoot, "node_modules", packageName);
        packagePackageJson = join(packageDir, "package.json");
      }
    }

    // Check 3: Verify package directory and package.json exist
    if (!existsSync(packageDir) || !existsSync(packagePackageJson)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Find the workspace root by looking for package.json with workspaces field
 */
function findWorkspaceRoot(currentDir: string): string | null {
  let dir = currentDir;

  while (dir !== "/" && dir !== ".") {
    const packageJsonPath = join(dir, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        if (packageJson.workspaces || packageJson.workspace) {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    dir = join(dir, "..");
  }

  return null;
}

/**
 * Install missing packages as dev dependencies
 * Prioritizes current project directory over workspace root
 */
export async function installPackages(
  packages: string[],
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner();

  try {
    spinner.start(`Installing ${packages.join(", ")} as dev dependencies...`);

    const { execSync } = await import("child_process");

    // Always install to current project directory first
    // Only fall back to workspace root if current directory doesn't have package.json
    const currentDirPackageJson = join(process.cwd(), "package.json");
    const installDir = existsSync(currentDirPackageJson)
      ? process.cwd()
      : findWorkspaceRoot(process.cwd()) || process.cwd();

    const command = `${packageManager.installCommand} -D ${packages.join(" ")}`;

    execSync(command, {
      stdio: "pipe",
      cwd: installDir,
    });

    const location =
      installDir === process.cwd() ? "project" : "workspace root";
    spinner.succeed(
      `Successfully installed ${packages.join(", ")} as dev dependencies in ${location}`
    );
  } catch (error) {
    spinner.fail("Failed to install packages");
    throw error;
  }
}
