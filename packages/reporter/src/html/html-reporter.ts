import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

import type { TestResult } from "@visnap/protocol";

import type { HtmlReporterOptions } from "../types";

import { serializeTestData } from "./data-serializer";
import { ImageHandler } from "./image-handler";
import { TemplateBuilder } from "./template-builder";

export class HtmlReporter {
  async generate(
    result: TestResult,
    options: HtmlReporterOptions
  ): Promise<string> {
    const data = serializeTestData(result);
    const testCases = result.outcome.testCases || [];

    // Process images
    const imageHandler = new ImageHandler();
    const processedTests = imageHandler.processTestCases(testCases);

    // Build HTML
    const templateBuilder = new TemplateBuilder();
    const html = templateBuilder.build(data, processedTests, options.title);

    // Determine output path
    const outputPath =
      options.outputPath || join(options.screenshotDir, "report.html");
    const outputDir = dirname(outputPath);

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, html);

    return outputPath;
  }
}
