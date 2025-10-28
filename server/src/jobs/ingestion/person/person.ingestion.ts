import { ObjectId } from "bson";
import type { IPersonV2 } from "shared/models";
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
  };

  const result = await personV2Db().findOneAndUpdate(
    {
      "identifiant.nom": data.identifiant.nom,
      "identifiant.prenom": data.identifiant.prenom,
      "identifiant.date_de_naissance": data.identifiant.date_de_naissance,
    },
    {
      $setOnInsert: { ...data },
    },
    { upsert: true, returnDocument: "after", includeResultMetadata: false }
  );

  return result!;
}
