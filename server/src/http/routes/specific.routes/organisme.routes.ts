import { compact, get } from "lodash-es";
import { ObjectId } from "mongodb";
import {
  getAnneesScolaireListFromDate,
  getSIFADate,
  requiredApprenantAdresseFieldsSifa,
  requiredFieldsSifa,
} from "shared";

import { isEligibleSIFA } from "@/common/actions/sifa.actions/sifa.actions";
import { effectifsDb } from "@/common/model/collections";

export async function getOrganismeEffectifs(organismeId: ObjectId, sifa = false) {
  const effectifs = await effectifsDb()
    .find({
      organisme_id: organismeId,
      ...(sifa
        ? {
            annee_scolaire: {
              $in: getAnneesScolaireListFromDate(sifa ? getSIFADate(new Date()) : new Date()),
            },
          }
        : {}),
    })
    .toArray();

  return effectifs.filter((effectif) => !sifa || isEligibleSIFA(effectif.apprenant.historique_statut));
}

export async function updateOrganismeEffectifs(
  organismeId: ObjectId,
  sifa = false,
  update: {
    "apprenant.type_cfa"?: string | undefined;
  }
) {
  if (!update["apprenant.type_cfa"]) return;
  const effectifs = await getOrganismeEffectifs(organismeId, sifa);
  await effectifsDb().updateMany(
    {
      _id: {
        $in: effectifs.map((effectif) => new ObjectId(effectif.id)),
      },
    },
    {
      ...(update["apprenant.type_cfa"] ? { $set: { "apprenant.type_cfa": update["apprenant.type_cfa"] } } : {}),
    }
  );
}
