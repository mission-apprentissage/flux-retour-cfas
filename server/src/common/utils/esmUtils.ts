import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const loadFile = createRequire(import.meta.url);

export const packageJson = loadFile("../../../package.json");

// add import.meta.url to filePath
export const __dirname = (filePath) => {
  const __filename = fileURLToPath(filePath);
  return path.dirname(__filename);
};
