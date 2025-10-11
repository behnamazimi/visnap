import baseConfig from "@vividiff/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
