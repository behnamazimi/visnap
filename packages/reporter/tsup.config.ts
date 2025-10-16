import { copyFileSync, mkdirSync } from "fs";
import { join } from "path";

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  onSuccess: async () => {
    // Copy HTML assets to dist folder
    const assetsDir = join(__dirname, "dist", "assets");
    mkdirSync(assetsDir, { recursive: true });

    const assets = [
      "src/html/assets/template.html",
      "src/html/assets/styles.css",
      "src/html/assets/alpine-app.js",
    ];

    assets.forEach(asset => {
      try {
        copyFileSync(
          join(__dirname, asset),
          join(assetsDir, asset.split("/").pop()!)
        );
        console.log(`✓ Copied ${asset} to dist/assets/`);
      } catch (error) {
        console.warn(`⚠ Failed to copy ${asset}:`, error);
      }
    });
  },
});
