import fs from "fs";
import path from "path";

import schema from "./schema";

export const hydrateOpenApi = async () => {
  const filePath = path.resolve(process.cwd(), "src/http/open-api.json");
  console.info(`Save file to ${filePath}`);
  fs.writeFileSync(filePath, JSON.stringify(schema, null, 2));
};
