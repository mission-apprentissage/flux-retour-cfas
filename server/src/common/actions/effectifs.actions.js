import { ObjectId } from "mongodb";
import { effectifsDb } from "../model/collections.js";
import { defaultValuesEffectif } from "../model/next.toKeep.models/effectifs.model/effectifs.model.js";

/**
 * Méthode de création d'un effectif
 * @returns
 */
export const createEffectif = async (lockAtCreate = false) => {
  const id_erp_apprenant = new ObjectId();
  const defaultValues = defaultValuesEffectif({ lockAtCreate });
  const test = {
    ...defaultValues,
    apprenant: {
      nom: "Hanry",
      prenom: "Pablo",
      ...defaultValues.apprenant,
    },
    formation: {
      cfd: "26033206",
      ...defaultValues.formation,
    },
    id_erp_apprenant: id_erp_apprenant.toString(), // == _id ??
    organisme_id: ObjectId("637fed03b6d2c1a37a2ffdab"),
    source: "TDB_MANUEL",
    annee_scolaire: "2020-2021",
  };
  //validateEffectif
  const { insertedId } = await effectifsDb().insertOne(test);

  return insertedId;
};

/**
 * Méthode de récupération des effectifs d'un organisme
 * @param {*} organisme_id
 * @param {*} projection
 * @returns
 */
export const findEffectifs = async (organisme_id, projection = {}) => {
  return await effectifsDb()
    .find({ organisme_id: ObjectId(organisme_id) }, { projection })
    .toArray();
};

/**
 * Méthode de mise à jour d'un effectif depuis son id
 * @param {*} id
 * @returns
 */
export const updateEffectif = async (id, data) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const effectif = await effectifsDb().findOne({ _id });
  if (!effectif) {
    throw new Error(`Unable to find effectif ${_id.toString()}`);
  }
  //validateEffectif
  const updated = await effectifsDb().findOneAndUpdate(
    { _id: effectif._id },
    {
      $set: {
        ...data,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};
