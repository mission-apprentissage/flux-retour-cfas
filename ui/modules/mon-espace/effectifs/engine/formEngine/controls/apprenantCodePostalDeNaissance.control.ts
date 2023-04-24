import { apiService } from "@/modules/mon-espace/effectifs/engine/services/api.service";

export const apprenantCodePostalDeNaissanceControl = [
  {
    deps: ["apprenant.code_postal_de_naissance"],
    process: async ({ values, organisme, signal }) => {
      const codePostal = values.apprenant.code_postal_de_naissance;
      const response = await apiService.fetchCodePostal({
        codePostal,
        organisme_id: organisme._id,
        signal,
      });

      if (response.messages.error) {
        return { error: response.messages.error };
      }
    },
  },
];
