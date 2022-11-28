import { ObjectId } from "mongodb";
import { effectifsDb } from "../model/collections.js";
import { defaultValuesEffectif } from "../model/next.toKeep.models/effectifs.model/effectifs.model.js";

/**
 * Méthode de création d'un effectif
 * @returns
 */
export const createEffectif = async (
  { organisme_id, annee_scolaire, source, id_erp_apprenant = null, apprenant: { nom, prenom }, formation: { cfd } },
  lockAtCreate = false
) => {
  const _id_erp_apprenant = id_erp_apprenant ?? new ObjectId().toString();
  const defaultValues = defaultValuesEffectif({ lockAtCreate });
  const dataToInsert = {
    ...defaultValues,
    apprenant: {
      nom,
      prenom,
      ...defaultValues.apprenant,
    },
    formation: {
      cfd,
      ...defaultValues.formation,
    },
    id_erp_apprenant: _id_erp_apprenant,
    organisme_id: ObjectId(organisme_id),
    source,
    annee_scolaire,
  };
  //validateEffectif
  const { insertedId } = await effectifsDb().insertOne(dataToInsert);

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
