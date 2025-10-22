/**
 * @fileoverview Interactive test case selection utility
 *
 * Provides interactive multi-select functionality for choosing test cases
 * using inquirer-checkbox-plus-plus with built-in search capabilities.
 */

import { listTestCasesCli, log } from "@visnap/core";
import type { CliOptions } from "@visnap/protocol";
import fuzzy from "fuzzy";
import checkboxPlus from "inquirer-checkbox-plus-plus";

export interface InteractiveSelectorOptions {
  /** CLI options for filtering test cases */
  cliOptions?: CliOptions;
  /** Custom message for the prompt */
  message?: string;
}

/**
 * Select test cases interactively using a searchable multi-select interface
 * @param options - Configuration options for the selector
 * @returns Promise resolving to array of selected test case IDs, or empty array if cancelled
 */
export async function selectTestCasesInteractively(
  options: InteractiveSelectorOptions = {}
): Promise<string[]> {
  const { cliOptions = {}, message = "Select test cases to run" } = options;
  try {
    // Discover test cases
    const result = await listTestCasesCli({}, cliOptions);

    if (result.testCases.length === 0) {
      log.error("No test cases found");
      log.plain(
        "Make sure your configuration is correct and adapters are properly set up"
      );
      return [];
    }

    // Get unique test case IDs (not variants)
    const uniqueTestCases = new Map<string, (typeof result.testCases)[0]>();
    result.testCases.forEach(testCase => {
      const id = testCase.caseId || "unknown";
      if (!uniqueTestCases.has(id)) {
        uniqueTestCases.set(id, testCase);
      }
    });

    // Get all test case IDs for fuzzy search
    const allTestCaseIds = Array.from(uniqueTestCases.keys());

    // Add summary info
    log.plain(`\n📋 Found ${uniqueTestCases.size} unique test cases:`);
    if (result.summary.browsers.length > 0) {
      log.plain(`• Browsers: ${result.summary.browsers.join(", ")}`);
    }
    if (result.summary.viewports.length > 0) {
      log.plain(`• Viewports: ${result.summary.viewports.join(", ")}`);
    }

    // Use checkbox-plus-plus with built-in search functionality
    const selectedIds = await checkboxPlus({
      message: `${message} (type to search, use arrow keys, space to select, enter to confirm):`,
      pageSize: 10,
      searchable: true,
      highlight: false,
      validate: (input: string[]) => {
        if (input.length === 0) {
          return "Please select at least one test case or press Ctrl+C to cancel";
        }
        return true;
      },
      source: async (_answersSoFar: any, input: string) => {
        input = input || "";

        // Add "Select all" option if no search input
        if (!input.trim()) {
          const selectAllChoice = {
            name: "Run all test cases",
            value: "__RUN_ALL__",
            short: "Run all",
          };
          const choices = allTestCaseIds.map(id => ({
            name: id,
            value: id,
            short: id,
          }));
          return [selectAllChoice, ...choices];
        }

        // Use fuzzy search to filter test case IDs
        const fuzzyResult = fuzzy.filter(input, allTestCaseIds);
        return fuzzyResult.map(element => ({
          name: element.original,
          value: element.original,
          short: element.original,
        }));
      },
    });

    if (selectedIds.length === 0) {
      log.info("No test cases selected");
      return [];
    }

    // Handle "Select all" option
    if (selectedIds.includes("__RUN_ALL__")) {
      // If "Select all" was selected, return all test case IDs (not just filtered ones)
      log.success(`Selected all ${allTestCaseIds.length} test case(s)`);
      return ["*"];
    }

    log.success(`Selected ${selectedIds.length} test case(s)`);
    return selectedIds;
  } catch (error) {
    // Handle user cancellation (Ctrl+C)
    if (error && typeof error === "object" && "isTtyError" in error) {
      log.info("Selection cancelled by user");
      return [];
    }

    // Handle other errors
    log.error("Failed to select test cases interactively");
    log.error(error instanceof Error ? error.message : String(error));
    return [];
  }
}
