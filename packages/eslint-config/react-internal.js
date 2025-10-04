import { baseConfig } from "./base.js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import storybook from "eslint-plugin-storybook";

/** @type {import("eslint").Linter.Config[]} */
export const reactInternalConfig = [
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      storybook,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...storybook.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
];
