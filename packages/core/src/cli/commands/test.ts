import { runTests } from "../../lib";
import { parseIncludeExclude } from "../../utils/args";
import { getErrorMessage } from "../../utils/error-handler";
import log from "../../utils/logger";

export const testCommand = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const useDocker = argv.includes("--docker");
  const cliFilters = parseIncludeExclude(argv);

  try {
    const result = await runTests({
      include: cliFilters.include,
      exclude: cliFilters.exclude,
      dryRun: cliFilters.dryRun,
      jsonReport: cliFilters.json,
      useDocker,
    });

    // Log results
    for (const browserResult of result.browserResults) {
      log.info(
        `[${browserResult.browser}] ${browserResult.passed} out of ${browserResult.total} tests passed`
      );
    }

    if (result.passed) {
      log.success("All stories are matching in all browsers");
    } else {
      log.error("Some stories are not matching");
    }

    process.exitCode = result.exitCode;
  } catch (error) {
    log.error(`Error running tests: ${getErrorMessage(error)}`);
    process.exitCode = 1;
  }
};
