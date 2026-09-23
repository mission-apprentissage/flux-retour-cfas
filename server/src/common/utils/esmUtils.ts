import path from "path";
import { fileURLToPath } from "url";

// add import.meta.url to filePath
export const __dirname = (filePath: string) => {
  const __filename = fileURLToPath(filePath);
  return path.dirname(__filename);
};
