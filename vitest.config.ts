import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["scripts/__tests__/**/*.test.ts", "tests/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
  resolve: {
    alias: { "@": "/src" },
  },
});
