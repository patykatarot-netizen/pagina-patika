import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // jsdom for component tests (DOM APIs available)
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // CSS: vitest should not process Tailwind v4 via PostCSS.
    // Component tests assert DOM structure, not visual styles.
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  esbuild: {
    // Vitest uses esbuild for JSX transform; the project tsconfig has
    // "jsx": "preserve" (Next.js handles it), so vitest needs this explicit.
    jsx: "automatic",
    jsxImportSource: "react",
  },
  // Prevent vite from loading the PostCSS config file during testing.
  // Tailwind v4's "@tailwindcss/postcss" plugin string causes resolution
  // failures in vitest's vite instance.
  css: {
    postcss: {},
  },
});
