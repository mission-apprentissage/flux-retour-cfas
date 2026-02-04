import { AnyBulkWriteOperation, ObjectId } from "mongodb";
import { IFormationV2 } from "shared/models";

import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import { formationV2Db } from "@/common/model/collections";

export async function hydrateFormationV2() {
  const cursor = apiAlternanceClient.formation.recherche({
    page_size: 1_000,
    include_archived: "true",
  });

  for await (const page of cursor) {
    const ops: AnyBulkWriteOperation<IFormationV2>[] = page.map((formation) => ({
      updateOne: {
        filter: {
          "identifiant.cfd": formation.certification.valeur.identifiant.cfd,
          "identifiant.rncp": formation.certification.valeur.identifiant.rncp,
          "identifiant.responsable_siret": formation.responsable.organisme?.identifiant.siret ?? null,
          "identifiant.responsable_uai": formation.responsable.organisme?.identifiant.uai ?? null,
          "identifiant.formateur_siret": formation.formateur.organisme?.identifiant.siret ?? null,
          "identifiant.formateur_uai": formation.formateur.organisme?.identifiant.uai ?? null,
        },
        update: {
          $set: {
            draft: false,
          },
          $setOnInsert: {
            _id: new ObjectId(),
          },
        },
        upsert: true,
      },
    }));

    await formationV2Db().bulkWrite(ops);
  }
}
