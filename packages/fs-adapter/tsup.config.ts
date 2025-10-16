import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: "node18",
  outDir: "dist",
});
