import { apiService } from "../../services/api.service";

export const apprentiCodePostalControl = [
  {
    deps: ["apprenti.adresse.codePostal"],
    process: async ({ values, dossier, signal }) => {
      const codePostal = values.apprenti.adresse.codePostal;
      const { messages, result } = await apiService.fetchCodePostal({
        codePostal,
        dossierId: dossier._id,
        signal,
      });

      if (messages?.cp === "Ok") {
        return {
          cascade: {
            "apprenti.adresse.commune": { value: result.commune.trim() },
          },
        };
      }

      return { error: messages?.error };
    },
  },
];
