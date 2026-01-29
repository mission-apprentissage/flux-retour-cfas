import { ObjectId } from "mongodb";
import type { IEffectifV2, IPersonV2 } from "shared/models";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { normalisePersonIdentifiant } from "@/common/actions/personV2/personV2.actions";
import { personV2Db } from "@/common/model/collections";

export type IIngestPersonUsedFields = "nom_apprenant" | "prenom_apprenant" | "date_de_naissance_apprenant";

export type IIngestPersonV2Params = Pick<IDossierApprenantSchemaV3, IIngestPersonUsedFields>;

export async function ingestPersonV2(dossier: IIngestPersonV2Params): Promise<IPersonV2> {
  const data: IPersonV2 = {
    _id: new ObjectId(),
    identifiant: normalisePersonIdentifiant({
      nom: dossier.nom_apprenant,
      prenom: dossier.prenom_apprenant,
      date_de_naissance: dossier.date_de_naissance_apprenant,
    }),
    parcours: { en_cours: null, chronologie: [] },
  };

  const result = await personV2Db().findOneAndUpdate(
    {
      "identifiant.nom": data.identifiant.nom,
      "identifiant.prenom": data.identifiant.prenom,
      "identifiant.date_de_naissance": data.identifiant.date_de_naissance,
    },
    {
      $setOnInsert: {
        ...data,
      },
    },
    { upsert: true, returnDocument: "after", includeResultMetadata: false }
  );

  return result!;
}

export async function updateParcoursPersonV2(person_id: ObjectId, effectifV2: IEffectifV2): Promise<void> {
  const date_inscription = effectifV2.date_inscription;
  const effv2_id = effectifV2._id;

  try {
    await personV2Db().updateOne(
      { _id: person_id, "parcours.chronologie.id": { $ne: effv2_id } }, // insert only if id not already in array
      {
        $push: {
          "parcours.chronologie": {
            $each: [{ id: effv2_id, date: date_inscription }],
            $sort: { date: 1 },
          },
        },
      },
      {
        bypassDocumentValidation: true,
      }
    );

    await personV2Db().updateOne(
      { _id: person_id },
      {
        $push: {
          "parcours.chronologie": {
            $each: [],
            $sort: { date: 1 },
          },
        },
      },
      {
        bypassDocumentValidation: true,
      }
    );

    await personV2Db().updateOne(
      { _id: person_id },
      [
        {
          $set: {
            "parcours.en_cours": {
              $arrayElemAt: ["$parcours.chronologie", -1],
            },
          },
        },
      ],
      {
        bypassDocumentValidation: true,
      }
    );
  } catch (e) {
    console.log(JSON.stringify(e, null, 2));
  }
}
