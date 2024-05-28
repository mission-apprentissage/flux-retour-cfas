import { compact, get } from "lodash-es";
import { ObjectId } from "mongodb";
import {
  getAnneesScolaireListFromDate,
  getSIFADate,
  requiredApprenantAdresseFieldsSifa,
  requiredFieldsSifa,
} from "shared";

import { isEligibleSIFA } from "@/common/actions/sifa.actions/sifa.actions";
import { effectifsDECADb, effectifsDb, organismesDb } from "@/common/model/collections";

export async function getOrganismeEffectifs(organismeId: ObjectId, sifa = false) {
  const organisme = await organismesDb().findOne({ _id: organismeId });
  const isDeca = !organisme?.is_transmission_target;
  const db = isDeca ? effectifsDECADb() : effectifsDb();

  const effectifs = await db
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

  return {
    fromDECA: isDeca,
    organismesEffectifs: effectifs
      .filter((effectif) => !sifa || isEligibleSIFA(effectif.apprenant.historique_statut))
      .map((effectif) => ({
        id: effectif._id.toString(),
        id_erp_apprenant: effectif.id_erp_apprenant,
        organisme_id: organismeId,
        annee_scolaire: effectif.annee_scolaire,
        source: effectif.source,
        validation_errors: effectif.validation_errors,
        formation: effectif.formation,
        nom: effectif.apprenant.nom,
        prenom: effectif.apprenant.prenom,
        date_de_naissance: effectif.apprenant.date_de_naissance,
        historique_statut: effectif.apprenant.historique_statut,
        statut: effectif._computed?.statut,
        ...(sifa
          ? {
              requiredSifa: compact(
                [
                  ...(!effectif.apprenant.adresse?.complete
                    ? [...requiredFieldsSifa, ...requiredApprenantAdresseFieldsSifa]
                    : requiredFieldsSifa),
                ].map((fieldName) =>
                  !get(effectif, fieldName) || get(effectif, fieldName) === "" ? fieldName : undefined
                )
              ),
            }
          : {}),
      })),
  };
}

export async function updateOrganismeEffectifs(
  organismeId: ObjectId,
  sifa = false,
  update: {
    "apprenant.type_cfa"?: string | undefined;
  }
) {
  if (!update["apprenant.type_cfa"]) return;
  const { fromDECA, organismesEffectifs } = await getOrganismeEffectifs(organismeId, sifa);

  !fromDECA &&
    (await effectifsDb().updateMany(
      {
        _id: {
          $in: organismesEffectifs.map((effectif) => new ObjectId(effectif.id)),
        },
      },
      {
        ...(update["apprenant.type_cfa"] ? { $set: { "apprenant.type_cfa": update["apprenant.type_cfa"] } } : {}),
      }
    ));
}
