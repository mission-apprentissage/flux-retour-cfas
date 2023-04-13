import { apiService } from "../../services/api.service";

export const rncpControl = [
  {
    deps: ["formation.rncp"],
    process: async ({ values, dossier, signal }) => {
      const rncp = values.formation.rncp;

      const { messages, result, error } = await apiService.fetchCfdrncp({
        rncp,
        dossierId: dossier._id,
        signal,
      });

      if (error) {
        return { error };
      }

      if (messages?.code_rncp !== "Ok") {
        return { error: messages.code_rncp };
      }

      if (result.active_inactive === "INACTIVE") {
        return { error: `Le code ${rncp} est inactif.` };
      }

      if (!result.cfds) {
        return {
          cascade: {
            "formation.codeDiplome": { reset: true, cascade: false },
            "formation.intituleQualification": { value: result.intitule_diplome },
          },
        };
      }

      if (result.cfds.length > 1) {
        //Todo: handle many cfds
        return {
          cascade: {
            "formation.codeDiplome": { value: result.cfds.join(","), cascade: false },
            "formation.intituleQualification": { value: result.intitule_diplome },
          },
        };
      }

      return {
        cascade: {
          "formation.codeDiplome": { value: result.cfds[0], cascade: false },
          "formation.intituleQualification": { value: result.intitule_diplome },
        },
      };
    },
  },
];
