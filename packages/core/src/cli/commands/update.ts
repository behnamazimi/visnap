import { updateBaseline } from "../../lib";
import { parseIncludeExclude } from "../../utils/args";
import log from "../../utils/logger";

export const updateCommand = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const useDocker = argv.includes("--docker");
  const cliFilters = parseIncludeExclude(argv);

  try {
    const result = await updateBaseline({
      include: cliFilters.include,
      exclude: cliFilters.exclude,
      dryRun: cliFilters.dryRun,
      useDocker,
    });

    if (result.success) {
      log.success(
        `Successfully updated baseline for ${result.browsers.join(", ")}`
      );
      log.info(`Total stories updated: ${result.totalStories}`);
    } else {
      log.error("Failed to update baseline");
      process.exitCode = 1;
    }
  } catch (error) {
    log.error(
      `Error updating baseline: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exitCode = 1;
  }
};
