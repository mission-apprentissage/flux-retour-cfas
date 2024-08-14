import { ObjectId } from "mongodb";

import { telechargementListesNominativesLogsDb } from "@/common/model/collections";

export const createTelechargementListeNomLog = async (
  type:
    | "apprenant"
    | "apprenti"
    | "inscritSansContrat"
    | "rupturant"
    | "abandon"
    | "inconnu"
    | "affelnet"
    | "organismes_sans_effectifs"
    | "organismes_nature_inconnue"
    | "organismes_siret_ferme"
    | "organismes_uai_non_determine",
  elementList: string[],
  date: Date,
  userId: ObjectId,
  organismeId?: ObjectId,
  organisationId?: ObjectId
) => {
  return await telechargementListesNominativesLogsDb().insertOne({
    _id: new ObjectId(),
    type,
    elementList: elementList,
    telechargement_date: date,
    user_id: userId,
    organisme_id: organismeId,
    organisation_id: organisationId,
  });
};
