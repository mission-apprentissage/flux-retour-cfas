import { ObjectId } from "mongodb";

import { personV2Db } from "@/common/model/collections";

export const getPersonV2 = async (nom: string, prenom: string, date_de_naissance: Date) => {
  return personV2Db().findOne({
    nom: nom.toLowerCase(),
    prenom: prenom.toLowerCase(),
    date_de_naissance: date_de_naissance,
  });
};
export const insertPersonV2 = async (nom: string, prenom: string, date_de_naissance: Date) => {
  return personV2Db().insertOne({
    _id: new ObjectId(),
    created_at: new Date(),
    updated_at: new Date(),
    nom: nom.toLowerCase(),
    prenom: prenom.toLowerCase(),
    date_de_naissance: date_de_naissance,
  });
};
