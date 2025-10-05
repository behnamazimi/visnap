import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    // Keep core package as external dependency
    "@visual-testing-tool/core",
  ],
  banner: {
    js: "#!/usr/bin/env node",
  },
});
