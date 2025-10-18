import type { VisualTestingToolConfig } from "@visnap/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { executeTestRun } from "@/utils/testcase-runner";

/**
 * Internal function that updates baseline screenshots with optional CLI overrides.
 * @param options - Configuration options for the update run
 * @param cliOptions - CLI-specific options for filtering and config path
 */
async function updateBaselineInternal(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: {
    include?: string | string[];
    exclude?: string | string[];
    configPath?: string;
  }
): Promise<void> {
  const effectiveConfig = await resolveEffectiveConfig(options, cliOptions);

  await executeTestRun(effectiveConfig, "update");
}

/**
 * Updates baseline screenshots with current captures.
 * @param options - Configuration options for the update run
 */
export async function updateBaseline(
  options: Partial<VisualTestingToolConfig>
): Promise<void> {
  return updateBaselineInternal(options);
}

/**
 * Updates baseline screenshots with CLI-specific options.
 * @param options - Configuration options for the update run
 * @param cliOptions - CLI options for filtering test cases
 */
export async function updateBaselineCli(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions: { include?: string | string[]; exclude?: string | string[] }
): Promise<void> {
  return updateBaselineInternal(options, cliOptions);
}
