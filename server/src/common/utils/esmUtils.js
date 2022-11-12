import { dirname } from "path";
import { fileURLToPath } from "url";

export const getDirname = (base) => dirname(fileURLToPath(base));
