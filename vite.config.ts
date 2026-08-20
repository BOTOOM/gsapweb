import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const defaultBase = process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith(".github.io")
  ? `/${repositoryName}/`
  : "/";

export default defineConfig({
  base: process.env.BASE_PATH ?? defaultBase,
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three"],
          gsap: ["gsap", "@gsap/react"],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
  },
});
