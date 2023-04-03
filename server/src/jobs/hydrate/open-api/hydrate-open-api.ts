import path from "path";
import fs from "fs";

import schema from "./schema.js";

export const hydrateOpenApi = async () => {
  const filePath = path.resolve(process.cwd(), "src/http/open-api.json");
  console.info(`Save file to ${filePath}`);
  fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
};
