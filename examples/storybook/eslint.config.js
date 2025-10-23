import { reactInternalConfig } from "@visnap/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...reactInternalConfig,
  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];
