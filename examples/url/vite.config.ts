import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  server: {
    port: 5174,
    open: true,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
