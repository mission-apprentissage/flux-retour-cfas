import { WithId } from "mongodb";
import { IEffectifQueue } from "shared/models/data/effectifsQueue.model";

import { getOrCreateEffectifV2 } from "@/common/actions/v2/effectif.v2.actions";
import { getOrCreateFormationV2 } from "@/common/actions/v2/formation.v2.actions";
import { getOrCreateOrganismeV2 } from "@/common/actions/v2/organisme.v2.actions";
import { insertTransmissionV2 } from "@/common/actions/v2/transmission.v2.actions";
import parentLogger from "@/common/logger";

const logger = parentLogger.child({
  module: "process-ingestion.v2",
});
export const handleEffectifTransmission = async (effectifQueue: WithId<IEffectifQueue>) => {
  // 1. Récupération de l'organisme
  try {
    const { etablissement_formateur_siret, etablissement_formateur_uai } = effectifQueue;
    const { etablissement_responsable_siret, etablissement_responsable_uai } = effectifQueue;

    const organismeFormateurId = await getOrCreateOrganismeV2(
      etablissement_formateur_uai,
      etablissement_formateur_siret
    );
    const organismeResponsableId = await getOrCreateOrganismeV2(
      etablissement_responsable_uai,
      etablissement_responsable_siret
    );

    // 2. Récupération de la formation
    const { formation_cfd, formation_rncp } = effectifQueue;
    const formationId = await getOrCreateFormationV2(
      formation_cfd,
      formation_rncp,
      organismeResponsableId,
      organismeFormateurId
    );

    // 3. Insertion de l'effectif

    await getOrCreateEffectifV2(
      formationId,
      effectifQueue.nom_apprenant,
      effectifQueue.prenom_apprenant,
      effectifQueue.date_de_naissance_apprenant
    );

    await insertTransmissionV2(effectifQueue.source_organisme_id, formationId);
  } catch (e) {
    logger.error("Error while processing effectif transmission v2", e);
  }
};
