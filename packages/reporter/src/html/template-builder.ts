import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { ReportData, ProcessedTestCase } from "../types";

export class TemplateBuilder {
  private getAssetPath(filename: string): string {
    // Always read from dist/assets folder (copied by tsup onSuccess)
    // Use import.meta.url for ESM, fallback to require.resolve for CJS
    try {
      // ESM path resolution - the built file is in dist/, so go up one level to find assets
      const currentFile = fileURLToPath(import.meta.url);
      const currentDir = dirname(currentFile);
      return join(currentDir, "assets", filename);
    } catch {
      // CJS path resolution
      throw new Error("Failed to get asset path to generate HTML report");
    }
  }

  private templatePath = this.getAssetPath("template.html");
  private stylesPath = this.getAssetPath("styles.css");
  private scriptPath = this.getAssetPath("alpine-app.js");

  build(
    data: ReportData,
    testCases: ProcessedTestCase[],
    title: string = "Vividiff Test Report"
  ): string {
    let template: string;
    let styles: string;
    let script: string;
    
    try {
      template = readFileSync(this.templatePath, "utf-8");
      styles = readFileSync(this.stylesPath, "utf-8");
      script = readFileSync(this.scriptPath, "utf-8");
    } catch (error) {
      throw new Error("File not found");
    }

    // Enrich data with processed test cases
    const enrichedData = {
      ...data,
      outcome: {
        ...data.outcome,
        testCases
      }
    };

    return template
      .replace(/{{TITLE}}/g, title)
      .replace("{{STYLES}}", styles)
      .replace("{{DATA}}", JSON.stringify(enrichedData))
      .replace("{{SCRIPT}}", script);
  }
}
