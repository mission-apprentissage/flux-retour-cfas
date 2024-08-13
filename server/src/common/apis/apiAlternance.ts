import { ApiClient } from "api-alternance-sdk";

import config from "@/config";

export const apiAlternanceClient = new ApiClient({
  endpoint: "https://api-recette.apprentissage.beta.gouv.fr/api",
  key: config.apiAlternance.key,
});
