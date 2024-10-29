import path from "path";

import tsconfigPaths from "vite-tsconfig-paths";
import { defineWorkspace } from "vitest/config"; // eslint-disable-line import/no-unresolved

export default defineWorkspace([
  {
    plugins: [tsconfigPaths()],
    test: {
      name: "server",
      root: "./server",
      include: ["./tests/**/*.test.ts", "./src/**/*.test.ts"],
      setupFiles: ["./tests/jest/setupFiles.ts"],
      globalSetup: ["./tests/jest/globalSetup.ts"],
      clearMocks: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./server/src"),
      },
    },
  },
  {
    plugins: [tsconfigPaths()],
    test: {
      name: "ui",
      root: "./ui",
      include: ["./**/*.test.ts"],
      setupFiles: ["./tests/setup.ts"],
      clearMocks: true,
    },
  },
  {
    plugins: [tsconfigPaths()],
    test: {
      name: "shared",
      root: "./shared",
      include: ["**/*.test.ts"],
      clearMocks: true,
    },
  },
]);
