import Boom from "boom";
import { compact, get } from "lodash-es";
import { ObjectId } from "mongodb";
import {
  getAnneesScolaireListFromDate,
  getSIFADate,
  requiredApprenantAdresseFieldsSifa,
  requiredFieldsSifa,
} from "shared";

import { findOrganismeByUai, getSousEtablissementsForUai } from "@/common/actions/organismes/organismes.actions";
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

  return effectifs
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
      historique_statut: effectif.apprenant.historique_statut,
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
    }));
}

export async function getOrganismeByUAIAvecSousEtablissements(uai: string) {
  const organisme = await findOrganismeByUai(uai);
  if (!organisme) {
    throw Boom.notFound(`No cfa found for UAI ${uai}`);
  }

  const sousEtablissements = await getSousEtablissementsForUai(uai);
  return {
    libelleLong: organisme.nom,
    reseaux: organisme.reseaux,
    uai: organisme.uai,
    nature: organisme.nature,
    adresse: organisme.adresse,
    sousEtablissements,
  };
}
