import { apiService } from "../../services/api.service";

export const codeDiplomeControl = [
  {
    deps: ["formation.codeDiplome"],
    process: async ({ values, dossier, signal }) => {
      const cfd = values.formation.codeDiplome;
      const { messages, result, error } = await apiService.fetchCfdrncp({
        cfd,
        dossierId: dossier._id,
        signal,
      });

      if (error) {
        return { error };
      }

      if (messages?.rncp.code_rncp !== "Ok") {
        return { error: messages?.code_rncp };
      }

      return {
        cascade: {
          "formation.rncp": { value: result.rncp.code_rncp, cascade: false },
          "formation.intituleQualification": { value: result.rncp.intitule_diplome },
        },
      };
    },
  },
];
