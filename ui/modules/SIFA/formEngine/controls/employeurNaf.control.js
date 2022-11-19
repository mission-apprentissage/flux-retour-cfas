import { apiService } from "../../services/api.service";

export const employeurNafControl = [
  {
    deps: ["employeur.naf"],
    process: async ({ values, dossier, signal }) => {
      const naf = values.employeur.naf;
      const formattedNaf = !naf.includes(".") && naf.length > 2 ? naf.substr(0, 2) + "." + naf.substr(2) : naf;

      const { error } = await apiService.fetchNaf({
        naf: formattedNaf,
        dossierId: dossier._id,
        signal,
      });

      if (error) {
        return { error };
      }
    },
  },
];
