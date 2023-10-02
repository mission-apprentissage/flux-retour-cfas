import { apiService } from "@/modules/mon-espace/effectifs/engine/services/api.service";

export const apprenantNouveauStatutLogic = [
  {
    deps: ["apprenant.nouveau_statut"],
    process: async ({ values, organisme, effectifId }) => {
      try {
        await apiService.saveEffectifForm({
          organisme_id: organisme._id,
          effectifId,
          data: {
            nouveau_statut: {
              date_statut: values.apprenant.historique_statut[0].date_statut,
              valeur_statut: values.apprenant.historique_statut[0].valeur_statut,
            },
          },
          inputNames: ["apprenant.nouveau_statut.date_statut", "apprenant.nouveau_statut.valeur_statut"],
        });
        window.location.reload(); // TODO tmp
      } catch (e) {
        console.error(e);
      }

      return { error: "stop propagation" };
    },
  },
];

export const apprenantNouveauStatutControl = apprenantNouveauStatutLogic;
