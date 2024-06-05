import { ObjectId } from "mongodb";

import { telechargementListesNominativesLogsDb } from "../model/collections";

export const createTelechargementListeNomLog = async (
  type: "apprenant" | "apprenti" | "inscritSansContrat" | "rupturant" | "abandon" | "inconnu",
  effectifsId: ObjectId[],
  date: Date,
  userId: ObjectId,
  organismeId?: ObjectId,
  organisationId?: ObjectId
) => {
  return await telechargementListesNominativesLogsDb().insertOne({
    _id: new ObjectId(),
    type,
    effectifs: effectifsId,
    telechargement_date: date,
    user_id: userId,
    organisme_id: organismeId,
    organisation_id: organisationId,
  });
};
