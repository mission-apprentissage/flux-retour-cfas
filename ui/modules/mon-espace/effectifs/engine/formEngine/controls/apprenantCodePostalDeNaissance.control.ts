import { CODE_POSTAL_FOREIGN_COUNTRY_ONLY_REGEX } from "shared";

import { apiService } from "@/modules/mon-espace/effectifs/engine/services/api.service";

export const apprenantCodePostalDeNaissanceControl = [
  {
    deps: ["apprenant.code_postal_de_naissance"],
    process: async ({ values, signal }) => {
      const codePostal = values.apprenant.code_postal_de_naissance;

      // l'api table_correspondance ne gère pas les codes postaux de type 99XXX
      // solution de contournement afin d'accepter ces valeurs
      if (CODE_POSTAL_FOREIGN_COUNTRY_ONLY_REGEX.test(codePostal)) {
        return;
      }

      // TODO: test
      const response = await apiService.fetchCodePostal({
        codePostal,
        signal,
      });

      if (response?.messages?.error) {
        return { error: response.messages.error };
      }
    },
  },
];
