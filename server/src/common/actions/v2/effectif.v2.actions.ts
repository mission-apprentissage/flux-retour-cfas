import { ObjectId } from "mongodb";

import { effectifV2Db, personV2Db } from "@/common/model/collections";

import { getOrCreatePersonV2 } from "./person.v2.actions";

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

export const getOrCreateEffectifV2 = async (
  formation_id: ObjectId,
  nom: string,
  prenom: string,
  date_de_naissance: Date /*or string to not become crazy with timezones ? */
) => {
  const effectif = await effectifV2Db().findOne({
    formation_id: formation_id,
    "_computed.nom": nom.toLowerCase(),
    "_computed.prenom": prenom.toLowerCase(),
    "_computed.date_de_naissance": date_de_naissance,
  });

  if (!effectif) {
    const personId = await getOrCreatePersonV2(nom, prenom, date_de_naissance);
    const { insertedId } = await insertEffectifV2(formation_id, personId);

    return insertedId;
  }

  return effectif._id;
};

const insertEffectifV2 = async (formation_id: ObjectId, person_id: ObjectId) => {
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
