import { baseConfig } from "./base.js";

/** @type {import("eslint").Linter.Config[]} */
export const nextJsConfig = [
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Next.js specific rules can be added here
    },
  },
];
