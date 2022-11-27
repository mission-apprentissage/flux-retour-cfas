import { apiService } from "../../services/api.service";

export const etablissementFormationCodePostalControl = [
  {
    deps: ["etablissementFormation.adresse.codePostal"],
    process: async ({ values, dossier, signal }) => {
      const codePostal = values.etablissementFormation.adresse.codePostal;
      const { messages, result } = await apiService.fetchCodePostal({
        codePostal,
        dossierId: dossier._id,
        signal,
      });

      if (messages.cp === "Ok") {
        return {
          cascade: {
            "etablissementFormation.adresse.commune": { value: result.commune.trim() },
          },
        };
      }

      return { error: messages.error };
    },
  },
];
