import { join } from "path";
import type { ProcessedTestCase } from "../types";
import type { TestCaseDetail } from "@visnap/protocol";

export interface ProcessedImagePaths {
  base: string;
  current: string;
  diff?: string;
}

export class ImageHandler {
  async getRelativeImagePaths(
    testCase: TestCaseDetail,
    screenshotDir: string
  ): Promise<ProcessedImagePaths> {
    const baseImage = join("base", testCase.captureFilename);
    const currentImage = join("current", testCase.captureFilename);
    let diffImage: string | undefined;

    if (testCase.status === "failed" && testCase.reason === "pixel-diff") {
      diffImage = join("diff", testCase.captureFilename);
    }

    return {
      base: baseImage,
      current: currentImage,
      diff: diffImage,
    };
  }

  processTestCases(
    testCases: TestCaseDetail[]
  ): ProcessedTestCase[] {
    return testCases.map((testCase) => {
      // Images are relative to the report location (screenshot directory)
      // Report will be at: screenshotDir/report.html
      // Images are at: screenshotDir/base/, screenshotDir/current/, screenshotDir/diff/
      
      return {
        ...testCase,
        baseImage: `./base/${testCase.captureFilename}`,
        currentImage: `./current/${testCase.captureFilename}`,
        diffImage: testCase.status === "failed" ? `./diff/${testCase.captureFilename}` : undefined,
      };
    });
  }
}
