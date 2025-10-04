import { copyFileSync, mkdirSync } from "fs";

import { defineConfig } from "tsup";

export default defineConfig([
  // Core library builds (ESM and CommonJS) - for programmatic use
  {
    entry: { core: "src/lib/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "cjs" ? ".cjs" : ".js",
      };
    },
  },
  // CLI executable (ESM and CommonJS with proper shebang)
  {
    entry: { cli: "src/cli/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "cjs" ? ".cjs" : ".js",
      };
    },
    banner: {
      js: "#!/usr/bin/env node",
    },
    onSuccess: async () => {
      // Only copy templates to dist
      mkdirSync("dist/templates", { recursive: true });
      copyFileSync(
        "templates/example-vtt.config.ts",
        "dist/templates/example-vtt.config.ts"
      );
      copyFileSync(
        "templates/example-vtt.config.js",
        "dist/templates/example-vtt.config.js"
      );
    },
  },
]);
