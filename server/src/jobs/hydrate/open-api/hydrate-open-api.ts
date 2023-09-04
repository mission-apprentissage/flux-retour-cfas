import fs from "fs";

import { openApiFilePath } from "@/http/open-api-path";

import schema from "./schema";

export const hydrateOpenApi = async () => {
  console.info(`Save file to ${openApiFilePath}`);
  fs.writeFileSync(openApiFilePath, JSON.stringify(schema, null, 2));
};
