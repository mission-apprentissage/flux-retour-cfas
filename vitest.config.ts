import path from "path";

import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config"; // eslint-disable-line import/no-unresolved

const exclude = [
  ...configDefaults.exclude,
  "**/dist/**",
  "**/cypress/**",
  "**/.{idea,git,cache,output,temp}/**",
  "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*",
];

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [tsconfigPaths()],
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "./server/src"),
          },
        },
        test: {
          name: "server",
          root: "./server",
          include: ["./tests/**/*.test.ts", "./src/**/*.test.ts"],
          exclude,
          setupFiles: ["./tests/jest/setupFiles.ts"],
          globalSetup: ["./tests/jest/globalSetup.ts"],
          clearMocks: true,
          testTimeout: 20_000,
          hookTimeout: 30_000,
          fakeTimers: {
            toFake: [
              "setTimeout",
              "clearTimeout",
              "setInterval",
              "clearInterval",
              "setImmediate",
              "clearImmediate",
              "Date",
            ],
          },
        },
      },
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "ui",
          root: "./ui",
          include: ["./**/*.test.ts"],
          exclude,
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
          exclude,
          clearMocks: true,
        },
      },
    ],
  },
});
