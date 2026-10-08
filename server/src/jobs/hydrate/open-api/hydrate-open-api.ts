import fs from "fs";

import logger from "@/common/logger";
import { openApiFilePath } from "@/http/open-api-path";

import schema from "./schema";

export const hydrateOpenApi = async () => {
  logger.info({ path: openApiFilePath }, "Sauvegarde du fichier OpenAPI");
  fs.writeFileSync(openApiFilePath, JSON.stringify(schema, null, 2));
};
