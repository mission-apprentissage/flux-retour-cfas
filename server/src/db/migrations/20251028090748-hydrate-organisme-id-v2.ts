import { IFormationV2 } from "shared/models";

import { getOrganismeByUAIAndSIRET } from "@/common/actions/organismes/organismes.actions";
import { formationV2Db } from "@/common/model/collections";

export const up = async () => {
  const cursor = formationV2Db().find();

  const BULK_SIZE = 1000;
  let bulkEffectifs: Array<IFormationV2> = [];

  const processFormation = async (formation: IFormationV2) => {
    if (
      !formation.identifiant.formateur_siret ||
      !formation.identifiant.formateur_uai ||
      !formation.identifiant.responsable_siret ||
      !formation.identifiant.responsable_uai
    ) {
      return;
    }

    const organismeFormateur = await getOrganismeByUAIAndSIRET(
      formation.identifiant.formateur_uai,
      formation.identifiant.formateur_siret
    );
    const organismeResponsable = await getOrganismeByUAIAndSIRET(
      formation.identifiant.responsable_uai,
      formation.identifiant.responsable_siret
    );

    return formationV2Db().updateOne(
      { _id: formation._id },
      {
        $set: {
          organisme_formateur_id: organismeFormateur?._id,
          organisme_responsable_id: organismeResponsable?._id,
        },
      }
    );
  };

  while (await cursor.hasNext()) {
    const formation = await cursor.next();
    if (!formation) continue;

    bulkEffectifs.push(formation);

    if (bulkEffectifs.length >= BULK_SIZE) {
      await Promise.allSettled(bulkEffectifs.map(processFormation));
      bulkEffectifs = [];
    }
  }

  if (bulkEffectifs.length > 0) {
    await Promise.allSettled(bulkEffectifs.map(processFormation));
  }
};
