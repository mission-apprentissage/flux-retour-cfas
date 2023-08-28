import path from "path";

import { __dirname } from "@/common/utils/esmUtils";

export const openApiFilePath = path.join(__dirname(import.meta.url), "./open-api.json");
