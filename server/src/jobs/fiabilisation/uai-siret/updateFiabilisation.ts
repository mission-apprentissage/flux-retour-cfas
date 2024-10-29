import { captureException } from "@sentry/node";
import { ApiError, type IRechercheOrganismeResponse } from "api-alternance-sdk";
import Boom from "boom";
import { STATUT_FIABILISATION_ORGANISME } from "shared/constants";

import { apiAlternanceClient } from "@/common/apis/apiAlternance";
import { organismesDb } from "@/common/model/collections";

type FiabilisationUaiSiret = {
  uai: string;
  siret: string;
  statut: "FIABLE" | "NON_FIABLE" | "INCONNU";
  api_response: IRechercheOrganismeResponse | null;
};

export async function fiabilisationUaiSiret({ uai, siret }): Promise<FiabilisationUaiSiret> {
  return apiAlternanceClient.organisme
    .recherche({ siret, uai })
    .then((apiData): FiabilisationUaiSiret => {
      const couple = apiData.resultat == null ? { uai, siret } : apiData.resultat.organisme.identifiant;

      return {
        ...couple,
        statut:
          apiData.resultat != null ? STATUT_FIABILISATION_ORGANISME.FIABLE : STATUT_FIABILISATION_ORGANISME.NON_FIABLE,
        api_response: apiData,
      };
    })
    .catch((error) => {
      if (error instanceof ApiError) {
        if (error.context.statusCode === 400) {
          const siretError = (error.context.errorData as any)?.validationError?.siret?._errors?.[0] ?? null;
          const uaiError = (error.context.errorData as any)?.validationError?.uai?._errors?.[0] ?? null;

          if (siretError || uaiError) {
            return {
              uai,
              siret,
              statut: STATUT_FIABILISATION_ORGANISME.NON_FIABLE,
              api_response: null,
            };
          }
        }
      }
      const err = Boom.internal("Échec de l'appel API pour la fiabilisation des organismes", { uai, siret });
      err.cause = error;
      captureException(err);

      return {
        uai,
        siret,
        statut: "INCONNU",
        api_response: null,
      };
    });
}

export async function updateOrganismesFiabilisationStatut() {
  for await (const organisme of organismesDb().find({})) {
    if (!organisme.uai || !organisme.siret) {
      // Dans le future, ce cas ne devrait pas arriver car tous les organismes devraient avoir un UAI et un SIRET
      await organismesDb().updateOne(
        { _id: organisme._id },
        { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABLE, fiabilisation_api_response: null } }
      );
      continue;
    }

    const result = await fiabilisationUaiSiret({ uai: organisme.uai, siret: organisme.siret });

    if (result.statut === "INCONNU") {
      continue;
    }

    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          fiabilisation_statut: result.statut,
          fiabilisation_api_response: result.api_response,
        },
      }
    );
  }
}
