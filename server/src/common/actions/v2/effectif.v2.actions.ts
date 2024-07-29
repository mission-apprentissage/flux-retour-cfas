import { ObjectId } from "mongodb";

import { effectifV2Db, personV2Db } from "@/common/model/collections";

const createComputed = async (person_id: ObjectId) => {
  const person = await personV2Db().findOne({ _id: person_id });
  if (!person) {
    return {
      nom: null,
      prenom: null,
      date_de_naissance: null,
    };
  }
  return {
    nom: person.nom,
    prenom: person.prenom,
    date_de_naissance: person.date_de_naissance,
  };
};

export const insertEffectifV2 = async (formation_id: ObjectId, person_id: ObjectId) => {
  const computed = await createComputed(person_id);
  return await effectifV2Db().insertOne({
    _id: new ObjectId(),
    draft: true,
    created_at: new Date(),
    updated_at: new Date(),
    formation_id,
    person_id,
    _computed: computed,
  });
};
