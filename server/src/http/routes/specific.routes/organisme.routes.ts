import { compact, get } from "lodash-es";
import Boom from "boom";

import {
  findOrganismeByUai,
  getSousEtablissementsForUai,
} from "../../../common/actions/organismes/organismes.actions.js";
import { findEffectifs } from "../../../common/actions/effectifs.actions.js";
import { isEligibleSIFA } from "../../../common/actions/sifa.actions/sifa.actions.js";
import { AuthContext } from "../../../common/model/internal/AuthContext.js";
import { requireManageEffectifsPermission } from "../../../common/actions/helpers/permissions.js";

export async function getOrganismeEffectifs(ctx: AuthContext, organismeId: string, sifa = false) {
  await requireManageEffectifsPermission(ctx, organismeId);

  const effectifsDb = await findEffectifs(organismeId);

  const effectifs: any[] = [];

  const requiredFieldsSifa = [
    "apprenant.nom",
    "apprenant.prenom",
    "apprenant.date_de_naissance",
    "apprenant.code_postal_de_naissance",
    "apprenant.sexe",
    "apprenant.derniere_situation",
    "apprenant.dernier_organisme_uai",
    "apprenant.organisme_gestionnaire",
    "formation.duree_formation_relle",
  ];

  const requiredApprenantAdresseFieldsSifa = [
    "apprenant.adresse.voie",
    "apprenant.adresse.code_postal",
    "apprenant.adresse.commune",
  ];

  for (const effectifDb of effectifsDb) {
    const { _id, id_erp_apprenant, source, annee_scolaire, validation_errors, apprenant, formation } = effectifDb;

    let historique_statut = apprenant.historique_statut;
    const effectif = {
      id: _id.toString(),
      id_erp_apprenant,
      organisme_id: organismeId,
      annee_scolaire,
      source,
      validation_errors,
      formation,
      nom: apprenant.nom,
      prenom: apprenant.prenom,
      historique_statut,
      ...(sifa
        ? {
            requiredSifa: compact(
              [
                ...(!apprenant.adresse?.complete
                  ? [...requiredFieldsSifa, ...requiredApprenantAdresseFieldsSifa]
                  : requiredFieldsSifa),
              ].map((fieldName) =>
                !get(effectifDb, fieldName) || get(effectifDb, fieldName) === "" ? fieldName : undefined
              )
            ),
          }
        : {}),
    };

    if (sifa) {
      if (isEligibleSIFA({ historique_statut })) {
        effectifs.push(effectif);
      }
    } else {
      effectifs.push(effectif);
    }
  }

  return effectifs;
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
    domainesMetiers: organisme.metiers,
    uai: organisme.uai,
    nature: organisme.nature,
    nature_validity_warning: organisme.nature_validity_warning,
    adresse: organisme.adresse,
    sousEtablissements,
  };
}
