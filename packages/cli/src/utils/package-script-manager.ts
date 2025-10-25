/**
 * @fileoverview Package.json script management utilities
 *
 * Provides utilities for adding and managing scripts in package.json files,
 * with support for both regular projects and monorepo workspaces.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { log } from "@visnap/core";

import { findWorkspaceRoot } from "./wizard/package-manager";

export interface PackageJsonScripts {
  [key: string]: string;
}

export interface PackageJson {
  name?: string;
  scripts?: PackageJsonScripts;
  [key: string]: any;
}

/**
 * Visual testing scripts to add to package.json
 */
export const VISUAL_TEST_SCRIPTS: PackageJsonScripts = {
  "visnap:test": "visnap test",
  "visnap:update": "visnap update",
  "visnap:open": "visnap open",
};

/**
 * Find the appropriate package.json file to modify
 * Prioritizes current directory, falls back to workspace root
 */
export function findTargetPackageJson(): string | null {
  const currentDirPackageJson = join(process.cwd(), "package.json");

  // If current directory has package.json, use it
  if (existsSync(currentDirPackageJson)) {
    return currentDirPackageJson;
  }

  // Otherwise, look for workspace root
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  if (workspaceRoot) {
    const workspacePackageJson = join(workspaceRoot, "package.json");
    if (existsSync(workspacePackageJson)) {
      return workspacePackageJson;
    }
  }

  return null;
}

/**
 * Read and parse a package.json file
 */
export function readPackageJson(packageJsonPath: string): PackageJson | null {
  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    log.warn(`Failed to read package.json at ${packageJsonPath}: ${error}`);
    return null;
  }
}

/**
 * Write a package.json file with proper formatting
 */
export function writePackageJson(
  packageJsonPath: string,
  packageJson: PackageJson
): void {
  try {
    const content = JSON.stringify(packageJson, null, 2) + "\n";
    writeFileSync(packageJsonPath, content, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to write package.json at ${packageJsonPath}: ${error}`
    );
  }
}

/**
 * Add visual testing scripts to package.json
 * Merges with existing scripts, doesn't overwrite existing ones
 */
export function addVisualTestScripts(packageJson: PackageJson): {
  added: string[];
  skipped: string[];
} {
  const added: string[] = [];
  const skipped: string[] = [];

  // Initialize scripts object if it doesn't exist
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  // Add each script if it doesn't already exist
  for (const [scriptName, scriptCommand] of Object.entries(
    VISUAL_TEST_SCRIPTS
  )) {
    if (packageJson.scripts[scriptName]) {
      skipped.push(scriptName);
    } else {
      packageJson.scripts[scriptName] = scriptCommand;
      added.push(scriptName);
    }
  }

  return { added, skipped };
}

/**
 * Add visual testing scripts to the appropriate package.json file
 * @returns Object containing information about the operation
 */
export function addVisualTestScriptsToProject(): {
  success: boolean;
  packageJsonPath: string | null;
  added: string[];
  skipped: string[];
  error?: string;
} {
  try {
    const packageJsonPath = findTargetPackageJson();

    if (!packageJsonPath) {
      return {
        success: false,
        packageJsonPath: null,
        added: [],
        skipped: [],
        error: "No package.json found in current directory or workspace root",
      };
    }

    const packageJson = readPackageJson(packageJsonPath);
    if (!packageJson) {
      return {
        success: false,
        packageJsonPath,
        added: [],
        skipped: [],
        error: "Failed to read package.json",
      };
    }

    const { added, skipped } = addVisualTestScripts(packageJson);

    if (added.length > 0) {
      writePackageJson(packageJsonPath, packageJson);
    }

    return {
      success: true,
      packageJsonPath,
      added,
      skipped,
    };
  } catch (error) {
    return {
      success: false,
      packageJsonPath: null,
      added: [],
      skipped: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
