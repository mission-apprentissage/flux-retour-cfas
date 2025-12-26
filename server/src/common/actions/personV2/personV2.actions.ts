import { capitalize } from "lodash-es";
import { IPersonV2 } from "shared/models";

import { personV2Db } from "@/common/model/collections";

export function normalisePersonIdentifiant(input: IPersonV2["identifiant"]): IPersonV2["identifiant"] {
  return {
    nom: input.nom.trim().normalize().toUpperCase(),
    prenom: capitalize(input.prenom.trim().normalize()),
    date_de_naissance: input.date_de_naissance,
  };
}

export async function getPersonV2FromIdentifiant(input: {
  nom: string;
  prenom: string;
  date_de_naissance: Date | null | undefined;
}): Promise<IPersonV2 | null> {
  if (!input.nom || !input.prenom || !input.date_de_naissance) {
    return null;
  }
  const normalizedIdentifiant = normalisePersonIdentifiant({
    nom: input.nom,
    prenom: input.prenom,
    date_de_naissance: input.date_de_naissance,
  });
  const person = await personV2Db().findOneAndUpdate(
    {
      "identifiant.nom": normalizedIdentifiant.nom,
      "identifiant.prenom": normalizedIdentifiant.prenom,
      "identifiant.date_de_naissance": normalizedIdentifiant.date_de_naissance,
    },
    {
      $setOnInsert: {
        identifiant: normalizedIdentifiant,
      },
    },
    { returnDocument: "after", upsert: true }
  );

  return person.value;
}
