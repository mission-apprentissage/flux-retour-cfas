import { captureException } from "@sentry/node";
import Boom from "boom";
import { ObjectId, WithId } from "mongodb";
import { IFormationV2 } from "shared/models";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import dossierApprenantSchemaV3 from "shared/models/parts/dossierApprenantSchemaV3";

import { getOrCreateEffectifV2 } from "@/common/actions/v2/effectif.v2.actions";
import { getOrCreateOrganismeV2 } from "@/common/actions/v2/organisme.v2.actions";
import { insertTransmissionV2 } from "@/common/actions/v2/transmission.v2.actions";
import parentLogger from "@/common/logger";
import { formationV2Db } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});

async function processFormation(dossier): Promise<IFormationV2> {
  // QUESTION: @Antoine est-ce qu'une formation est unique par cfd + rncp + formateur + responsable + code_postal ??

  // On recherche la formation par SIRET / UAI plutot que l'identifiant TBA
  // En effet, tous les organismes liés aux formations ne sont pas forcément dans le TBA
  const filter = {
    "certification.cfd": dossier.formation_cfd ?? null,
    "certification.rncp": dossier.formation_rncp ?? null,

    "responsable.siret": dossier.etablissement_responsable_siret,
    "responsable.uai": dossier.etablissement_responsable_uai,

    "formateur.siret": dossier.etablissement_formateur_siret,
    "formateur.uai": dossier.etablissement_formateur_uai,
  };

  const formation = await formationV2Db().findOne(filter);

  if (formation) {
    return formation;
  }

  const now = new Date();

  const draftFormation: IFormationV2 = {
    _id: new ObjectId(),
    cle_ministere_educatif: null,
    certification: {
      cfd: filter["certification.cfd"],
      rncp: filter["certification.rncp"],
    },
    responsable: {
      tdb_id: null, // TODO: does tdb_id is required?
      siret: filter["responsable.siret"],
      uai: filter["responsable.uai"],
    },
    formateur: {
      tdb_id: null, // TODO: does tdb_id is required?
      siret: filter["formateur.siret"],
      uai: filter["formateur.uai"],
    },
    created_at: now,
    updated_at: now,
  };

  // Handle possible race conditions, use upsert to make sure we do not duplicate formations
  await formationV2Db().updateOne(filter, { $setOnInsert: draftFormation }, { upsert: true });

  // TODO: update organisme relation compute ??

  return formationV2Db()
    .findOne(filter)
    .then((f) => {
      if (!f) {
        throw Boom.internal("processFormation: unable to retrieve draft fromation just created");
      }

      return f;
    });
}

export const handleEffectifTransmission = async (effectifQueue: WithId<IEffectifQueue>) => {
  // 1. Récupération de l'organisme
  try {
    const dossierApprenant = dossierApprenantSchemaV3.parse(effectifQueue);

    const { etablissement_formateur_siret, etablissement_formateur_uai } = dossierApprenant;
    const { etablissement_responsable_siret, etablissement_responsable_uai } = dossierApprenant;

    await getOrCreateOrganismeV2(etablissement_formateur_uai, etablissement_formateur_siret);
    await getOrCreateOrganismeV2(etablissement_responsable_uai, etablissement_responsable_siret);

    // 2. Récupération de la formation
    const formation = await processFormation(dossierApprenant);

    // 3. Insertion de l'effectif

    await getOrCreateEffectifV2(
      formation._id,
      dossierApprenant.nom_apprenant,
      dossierApprenant.prenom_apprenant,
      dossierApprenant.date_de_naissance_apprenant
    );

    await insertTransmissionV2(dossierApprenant.source_organisme_id, formation._id);
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
    captureException(e);
  }
};
