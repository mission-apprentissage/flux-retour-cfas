import fs from "node:fs";
import { basename } from "node:path";

import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const files = fs.readdirSync("./src/db/migrations");

  const isDev = options.env?.NODE_ENV !== "production";

  const entry: Record<string, string> = {
    index: isDev ? "src/dev.ts" : "src/main.ts",
  };

  for (const file of files) {
    entry[`db/migrations/${basename(file, ".ts")}`] = `src/db/migrations/${file}`;
  }

  return {
    entry,
    watch: isDev && options.watch ? ["./src", "../shared/src"] : false,
    onSuccess: isDev && options.watch ? "yarn cli start --withProcessor" : "",
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
