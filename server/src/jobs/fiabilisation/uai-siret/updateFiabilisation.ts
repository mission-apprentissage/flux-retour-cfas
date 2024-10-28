import { captureException } from "@sentry/node";
import { ApiError, type IRechercheOrganismeResponse } from "api-alternance-sdk";
import Boom from "boom";
import { STATUT_FIABILISATION_ORGANISME } from "shared/constants";

import { apiAlternanceClient } from "@/common/apis/apiAlternance";
import { organismesDb } from "@/common/model/collections";

async function isCoupleFiable({ uai, siret }): Promise<[boolean | null, IRechercheOrganismeResponse | null]> {
  return apiAlternanceClient.organisme
    .recherche({ siret, uai })
    .then((apiData): [boolean | null, IRechercheOrganismeResponse | null] => {
      return [apiData.resultat != null, apiData];
    })
    .catch((error) => {
      if (error instanceof ApiError) {
        if (error.context.statusCode === 400) {
          const siretError = (error.context.errorData as any)?.validationError?.siret?._errors?.[0] ?? null;
          const uaiError = (error.context.errorData as any)?.validationError?.uai?._errors?.[0] ?? null;

          if (siretError || uaiError) {
            return [false, null];
          }
        }
      }
      const err = Boom.internal("Échec de l'appel API pour la fiabilisation des organismes", { uai, siret });
      err.cause = error;
      captureException(err);

      return [null, null];
    });
}

async function addNewlyCreatedOrganismesToFiabilisation() {}

export async function updateOrganismesFiabilisationStatut() {
  await addNewlyCreatedOrganismesToFiabilisation();

  for await (const organisme of organismesDb().find({})) {
    if (!organisme.uai || !organisme.siret) {
      // Dans le future, ce cas ne devrait pas arriver car tous les organismes devraient avoir un UAI et un SIRET
      await organismesDb().updateOne(
        { _id: organisme._id },
        { $set: { fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.NON_FIABLE, fiabilisation_api_response: null } }
      );
      continue;
    }

    const [isFiable, data] = await isCoupleFiable({ uai: organisme.uai, siret: organisme.siret });

    if (isFiable === null) {
      continue;
    }

    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          fiabilisation_statut: isFiable
            ? STATUT_FIABILISATION_ORGANISME.FIABLE
            : STATUT_FIABILISATION_ORGANISME.NON_FIABLE,
          fiabilisation_api_response: data,
        },
      }
    );
  }
}
