/**
 * @fileoverview Reporter configuration resolution utilities
 */

import type { VisualTestingToolConfig } from "@visnap/protocol";

export interface ReporterConfig {
  html: {
    enabled: boolean;
    outputPath?: string;
  };
  json: {
    enabled: boolean;
    outputPath?: string;
  };
}

/**
 * Resolves HTML reporter configuration from CLI and config options
 */
export function resolveHtmlReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliHtmlReport?: string | boolean,
  screenshotDir: string = "./visnap"
): { enabled: boolean; outputPath?: string } {
  let htmlEnabled = true; // default
  let htmlPath: string | undefined;

  // CLI overrides take precedence
  if (cliHtmlReport !== undefined) {
    if (cliHtmlReport === false || cliHtmlReport === "false") {
      htmlEnabled = false;
    } else if (typeof cliHtmlReport === "string") {
      htmlEnabled = true;
      htmlPath = cliHtmlReport;
    } else if (cliHtmlReport === true || cliHtmlReport === "true") {
      htmlEnabled = true;
    }
  } else {
    // Apply config values only if CLI doesn't override
    if (configReporter?.html !== undefined) {
      if (typeof configReporter.html === "boolean") {
        htmlEnabled = configReporter.html;
      } else if (typeof configReporter.html === "string") {
        htmlEnabled = true;
        htmlPath = configReporter.html;
      }
    }
  }

  // Set default path if enabled but no path specified
  if (htmlEnabled && !htmlPath) {
    htmlPath = `${screenshotDir}/report.html`;
  }

  return { enabled: htmlEnabled, outputPath: htmlPath };
}

/**
 * Resolves JSON reporter configuration from CLI and config options
 */
export function resolveJsonReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliJsonReport?: string | boolean,
  screenshotDir: string = "./visnap"
): { enabled: boolean; outputPath?: string } {
  let jsonEnabled = true; // default
  let jsonPath: string | undefined;

  // CLI overrides take precedence
  if (cliJsonReport !== undefined) {
    if (cliJsonReport === false || cliJsonReport === "false") {
      jsonEnabled = false;
    } else if (typeof cliJsonReport === "string") {
      jsonEnabled = true;
      jsonPath = cliJsonReport;
    } else if (cliJsonReport === true || cliJsonReport === "true") {
      jsonEnabled = true;
    }
  } else {
    // Apply config values only if CLI doesn't override
    if (configReporter?.json !== undefined) {
      if (typeof configReporter.json === "boolean") {
        jsonEnabled = configReporter.json;
      } else if (typeof configReporter.json === "string") {
        jsonEnabled = true;
        jsonPath = configReporter.json;
      }
    }
  }

  // Set default path if enabled but no path specified
  if (jsonEnabled && !jsonPath) {
    jsonPath = `${screenshotDir}/report.json`;
  }

  return { enabled: jsonEnabled, outputPath: jsonPath };
}

/**
 * Resolves complete reporter configuration from CLI and config options
 */
export function resolveReporterConfig(
  configReporter: VisualTestingToolConfig["reporter"],
  cliHtmlReport?: string | boolean,
  cliJsonReport?: string | boolean,
  screenshotDir: string = "./visnap"
): ReporterConfig {
  return {
    html: resolveHtmlReporterConfig(
      configReporter,
      cliHtmlReport,
      screenshotDir
    ),
    json: resolveJsonReporterConfig(
      configReporter,
      cliJsonReport,
      screenshotDir
    ),
  };
}
