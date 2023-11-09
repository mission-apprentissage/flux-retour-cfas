import { apiService } from "@/modules/mon-espace/effectifs/engine/services/api.service";

const uaiRegex = new RegExp("^[0-9]{7}[a-zA-Z]$");
export const apprenantDernierOrganismeUaiControl = [
  {
    deps: ["apprenant.dernier_organisme_uai"],
    process: async ({ values, signal }) => {
      const userUai = values.apprenant.dernier_organisme_uai;
      if (uaiRegex.test(userUai)) {
        const { error } = await apiService.fetchUAI({
          uai: userUai,
          signal,
        });

        if (error) {
          return { error: error };
        }
      }
    },
  },
];
