import { type Command as CommanderCommand } from "commander";

import { PresentationService } from "../services/presentation-service";
import { TestService, resolveReporterConfig } from "../services/test-service";
import { type Command } from "../types";
import { type CliOptions } from "../types/cli-options";
import { ErrorHandler } from "../utils/error-handler";
import { exit } from "../utils/exit";

interface TestCommandOptions extends CliOptions {
  jsonReport?: string | boolean; // when provided without a path => stdout JSON; when a path => write file
  htmlReport?: string | boolean; // when provided without a path => write to screenshotDir; when a path => write to specified location
  docker?: boolean;
}

const testHandler = async (options: TestCommandOptions): Promise<void> => {
  const testService = new TestService();
  const presentationService = new PresentationService();

  try {
    if (options.docker) {
      presentationService.startLoading("Starting Docker container...");
      const result = await testService.executeTests(options);
      presentationService.completeLoading("Docker test completed");
      exit(result.exitCode);
      return;
    }

    presentationService.startLoading("Discovering test cases...");
    presentationService.updateLoading("Running visual tests...");

    const result = await testService.executeTests(options);

    presentationService.completeLoading("Visual tests completed");

    // Resolve reporter configuration for display purposes
    const reporterConfig = resolveReporterConfig(
      result.config?.reporter,
      options.htmlReport,
      options.jsonReport,
      result.config?.screenshotDir || "./vividiff"
    );

    // Generate JSON report if enabled
    if (reporterConfig.json.enabled) {
      presentationService.updateLoading("Generating JSON report...");
      // Report generation is handled by the service
      presentationService.completeLoading(
        `JSON report written to: ${reporterConfig.json.outputPath}`
      );
    }

    // Generate HTML report if enabled
    if (reporterConfig.html.enabled) {
      presentationService.updateLoading("Generating HTML report...");
      // Report generation is handled by the service
      presentationService.completeLoading(
        `HTML report generated: ${reporterConfig.html.outputPath}`
      );
    }

    if (!reporterConfig.json.enabled && !reporterConfig.html.enabled) {
      presentationService.stopLoading();
      presentationService.displayTestSummary(result);
    }

    exit(result.exitCode);
  } catch (error) {
    presentationService.failLoading("Test execution failed");
    ErrorHandler.handle(error, {
      command: "test",
      operation: "visual testing",
      suggestion: "Check your configuration and ensure Storybook is running",
    });
    exit(1);
  }
};

export const command: Command<TestCommandOptions> = {
  name: "test",
  description: "Capture current screenshots and compare with baseline",
  handler: testHandler,
  configure: (cmd: CommanderCommand) => {
    return cmd
      .option(
        "--jsonReport [value]",
        "Generate JSON report. Use --jsonReport=false to disable, --jsonReport or --jsonReport=path for custom location"
      )
      .option(
        "--htmlReport [value]",
        "Generate HTML report. Use --htmlReport=false to disable, --htmlReport or --htmlReport=path for custom location"
      )
      .option("--docker", "Run inside Docker")
      .option(
        "--include <pattern>",
        "Include test cases matching pattern (can be used multiple times)"
      )
      .option(
        "--exclude <pattern>",
        "Exclude test cases matching pattern (can be used multiple times)"
      );
  },
};
