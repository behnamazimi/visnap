import type {
  VisualTestingToolConfig,
  BrowserName,
  BrowserConfiguration,
} from "@visnap/protocol";

import { DEFAULT_BROWSER } from "@/constants";

export type BrowserTarget = {
  name: BrowserName;
  options?: Record<string, unknown>;
};

/**
 * Parse browser configurations from adapter config
 */
export function parseBrowsersFromConfig(
  adaptersConfig: VisualTestingToolConfig["adapters"]
): BrowserTarget[] {
  const browserConfig = adaptersConfig?.browser?.options;
  const browserConfigurations = browserConfig?.browser as
    | BrowserConfiguration
    | BrowserConfiguration[]
    | undefined;

  if (!browserConfigurations) return [{ name: DEFAULT_BROWSER }];

  if (Array.isArray(browserConfigurations)) {
    return browserConfigurations.map(config =>
      typeof config === "string"
        ? { name: config as BrowserName }
        : { name: config.name, options: config.options }
    );
  }

  if (typeof browserConfigurations === "string") {
    return [{ name: browserConfigurations as BrowserName }];
  }

  return [
    {
      name: browserConfigurations.name,
      options: browserConfigurations.options,
    },
  ];
}
