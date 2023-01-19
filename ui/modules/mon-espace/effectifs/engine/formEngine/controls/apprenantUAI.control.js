import { apiService } from "../../services/api.service";

export const apprenantDernierOrganismeUaiControl = [
  {
    deps: ["apprenant.dernier_organisme_uai"],
    process: async ({ values, organisme, signal }) => {
      const userUai = values.apprenant.dernier_organisme_uai;
      // eslint-disable-next-line no-unused-vars
      const { uai, error } = await apiService.fetchUAI({
        uai: userUai,
        organisme_id: organisme._id,
        signal,
      });

      if (error) {
        return { error: error };
      }

      // return {
      //   cascade: {
      //     "apprenant.dernier_organisme_uai": { value: uai },
      //   },
      // };
    },
  },
];
