import type { VisualTestingToolConfig } from "@vividiff/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { runTestCasesOnBrowser } from "@/utils/testcase-runner";

// New function after tool agnostic design
// TODO: should accept partial options in mature versions
export async function updateBaseline(
  options: Partial<VisualTestingToolConfig>
): Promise<void> {
  const effectiveConfig = await resolveEffectiveConfig(options);

  await runTestCasesOnBrowser(effectiveConfig, "update");
}
