import type { VisualTestingToolConfig } from "@vividiff/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { runTestCasesOnBrowser } from "@/utils/testcase-runner";

// Internal function that handles the core logic
async function updateBaselineInternal(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions?: { include?: string | string[]; exclude?: string | string[] }
): Promise<void> {
  const effectiveConfig = await resolveEffectiveConfig(options, cliOptions);

  await runTestCasesOnBrowser(effectiveConfig, "update");
}

// New function after tool agnostic design
// TODO: should accept partial options in mature versions
export async function updateBaseline(
  options: Partial<VisualTestingToolConfig>
): Promise<void> {
  return updateBaselineInternal(options);
}

// CLI-specific function that handles CLI options
export async function updateBaselineCli(
  options: Partial<VisualTestingToolConfig> = {},
  cliOptions: { include?: string | string[]; exclude?: string | string[] }
): Promise<void> {
  return updateBaselineInternal(options, cliOptions);
}
