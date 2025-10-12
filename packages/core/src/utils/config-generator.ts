import { generateConfigContent as generateConfigContentTemplate } from "./config-template";

import { type InitOptions } from "@/lib/api/init";

/**
 * Generate configuration file content based on options
 */
export function generateConfigContent(options: InitOptions): string {
  const { configType = "ts", threshold = 0.1 } = options;

  return generateConfigContentTemplate({
    configType,
    threshold,
  });
}

/**
 * Generate .gitignore content for screenshot directories
 */
export function generateGitignoreContent(): string {
  return `# Visual Testing Tool - Ignore generated screenshots
# Keep baseline screenshots in version control, ignore current and diff
current/
diff/
`;
}
