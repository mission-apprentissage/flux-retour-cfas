/* eslint-disable import/no-commonjs */
import { dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

export const packageJson = require("../../../package.json");

export const getDirname = (base) => dirname(fileURLToPath(base));
