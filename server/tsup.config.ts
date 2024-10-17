import fs from "node:fs";
import { basename } from "node:path";

import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const isDev = options.env?.NODE_ENV !== "production";
  const isWatched = options.env?.TSUP_WATCH === "true";
  const migrationFiles = fs.readdirSync("./src/db/migrations");

  const entry: Record<string, string> = {
    index: isDev ? "src/dev.ts" : "src/main.ts",
  };

  for (const file of migrationFiles) {
    entry[`db/migrations/${basename(file, ".ts")}`] = `src/db/migrations/${file}`;
  }

  return {
    entry,
    watch: isWatched ? ["./src", "../shared"] : false,
    onSuccess: isWatched ? "yarn cli start --withProcessor" : "",
    ignoreWatch: ["../shared/node_modules/**"],
    // In watch mode doesn't exit cleanly as it causes EADDRINUSE error
    killSignal: "SIGKILL",
    target: "es2022",
    platform: "node",
    format: ["esm"],
    splitting: true,
    shims: false,
    minify: false,
    sourcemap: true,
    noExternal: ["shared"],
    clean: true,
    env: {
      ...options.env,
    },
    esbuildOptions(options) {
      options.define = {
        ...options.define,
        "process.env.IS_BUILT": '"true"',
        "process.env.NODE_ENV": isDev ? '"developpement"' : '"production"',
      };
    },
  };
});
