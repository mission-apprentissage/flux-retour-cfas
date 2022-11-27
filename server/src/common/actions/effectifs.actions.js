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
