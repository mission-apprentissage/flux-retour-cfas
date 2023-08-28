import fs from "node:fs";
import { basename } from "node:path";

import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const files = fs.readdirSync("./src/db/migrations");

  const entry: Record<string, string> = {
    index: options.watch ? "src/dev.ts" : "src/main.ts",
  };

  for (const file of files) {
    entry[`db/migrations/${basename(file, ".js")}`] = `src/db/migrations/${file}`;
  }

  return {
    entry,
    watch: options.watch ? ["./src", "../shared/src"] : false,
    onSuccess: options.watch ? "yarn cli start --withProcessor" : "",
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
  };
});
