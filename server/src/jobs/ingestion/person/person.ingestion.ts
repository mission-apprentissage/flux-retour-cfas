import { ObjectId } from "bson";
import { capitalize } from "lodash-es";
import type { IPersonV2 } from "shared/models";
import type { IDossierApprenantSchemaV3 } from "shared/models/parts/dossierApprenantSchemaV3";

import { personV2Db } from "@/common/model/collections";

export type IIngestPersonV2Params = Pick<
  IDossierApprenantSchemaV3,
  "nom_apprenant" | "prenom_apprenant" | "date_de_naissance_apprenant"
>;

function normalisePersonIdentifiant(input: IPersonV2["identifiant"]): IPersonV2["identifiant"] {
  return {
    nom: input.nom.trim().normalize().toUpperCase(),
    prenom: capitalize(input.prenom.trim().normalize()),
    date_de_naissance: input.date_de_naissance,
  };
}

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
