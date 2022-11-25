import { apiService } from "../../services/api.service";

export const organismeFormationCodePostalControl = [
  {
    deps: ["organismeFormation.adresse.codePostal"],
    process: async ({ values, dossier, signal }) => {
      const codePostal = values.organismeFormation.adresse.codePostal;
      const { messages, result } = await apiService.fetchCodePostal({
        codePostal,
        dossierId: dossier._id,
        signal,
      });

      if (messages.cp === "Ok") {
        return {
          cascade: {
            "organismeFormation.adresse.commune": { value: result.commune.trim() },
          },
        };
      }

      return { error: messages.error };
    },
  },
];
