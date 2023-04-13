import { apiService } from "../../services/api.service";

export const employeurCodePostalControl = [
  {
    deps: ["employeur.adresse.codePostal"],
    process: async ({ values, dossier, signal }) => {
      const codePostal = values.employeur.adresse.codePostal;
      const { messages, result } = await apiService.fetchCodePostal({
        codePostal,
        dossierId: dossier._id,
        signal,
      });

      if (messages.cp === "Ok") {
        return {
          cascade: {
            "employeur.adresse.commune": { value: result.commune.trim() },
            "employeur.adresse.departement": { value: result.num_departement.trim() },
            "employeur.adresse.region": { value: result.num_region.trim() },
          },
        };
      }

      return { error: messages.error };
    },
  },
];
