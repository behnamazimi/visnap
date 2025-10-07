import type { VisualTestingToolConfig } from "@visual-testing-tool/protocol";

import { resolveEffectiveConfig } from "@/lib/config";
import { runTestCasesOnBrowser } from "@/utils/testcase-runner";

// New function after tool agnostic design
// TODO: should accept partial options in mature versions
export async function runVisualTests(
  options: Partial<VisualTestingToolConfig> = {}
): Promise<void> {
  const effectiveConfig = await resolveEffectiveConfig(options);

  await runTestCasesOnBrowser(effectiveConfig, "test");
}
