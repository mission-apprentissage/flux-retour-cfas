import { ObjectId } from "mongodb";

import { personV2Db } from "@/common/model/collections";

export const getOrCreatePersonV2 = async (nom: string, prenom: string, date_de_naissance: Date) => {
  const person = await getPersonV2(nom, prenom, date_de_naissance);

  if (!person) {
    const { insertedId } = await insertPersonV2(nom, prenom, date_de_naissance);

    return insertedId;
  }
  return person._id;
};
const getPersonV2 = async (nom: string, prenom: string, date_de_naissance: Date) => {
  return personV2Db().findOne({
    nom: nom.toLowerCase(),
    prenom: prenom.toLowerCase(),
    date_de_naissance: new Date(date_de_naissance),
  });
};
const insertPersonV2 = async (nom: string, prenom: string, date_de_naissance: Date) => {
  return personV2Db().insertOne({
    _id: new ObjectId(),
    created_at: new Date(),
    updated_at: new Date(),
    nom: nom.toLowerCase(),
    prenom: prenom.toLowerCase(),
    date_de_naissance: new Date(date_de_naissance),
  });
};
