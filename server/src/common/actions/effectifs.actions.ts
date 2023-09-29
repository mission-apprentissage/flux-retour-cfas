import { isObject, merge, reduce, set, uniqBy } from "lodash-es";
import { ObjectId, WithId } from "mongodb";

import { Effectif } from "@/common/model/@types/Effectif";
import { effectifsDb } from "@/common/model/collections";
import { defaultValuesEffectif } from "@/common/model/effectifs.model/effectifs.model";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { Organisme } from "../model/@types";

import { checkIndicateursFiltersPermissions } from "./effectifs/effectifs.actions";
import { LegacyEffectifsFilters, buildMongoPipelineFilterStages } from "./helpers/filters";

/**
 * Méthode de build d'un effectif
 */
export const mergeEffectifWithDefaults = <T extends Partial<Effectif>>(effectifData: T) => {
  const defaultValues = defaultValuesEffectif();
  // note: I've tried to use ts-deepmerge, but typing doesn't work well
  return {
    ...defaultValues,
    ...effectifData,
    apprenant: {
      ...defaultValues.apprenant,
      ...effectifData.apprenant,
    },
    is_lock: {
      ...defaultValues.is_lock,
      ...effectifData.is_lock,
    },
    formation: {
      ...defaultValues.formation,
      ...effectifData.formation,
    },
  };
};

/**
 * Méthode de création d'un effectif
 */
export const createEffectif = async <T extends Omit<Effectif, "organisme_id">>(
  dataEffectif: T,
  organisme: WithId<Organisme>
) => {
  const dataToInsert = mergeEffectifWithDefaults({
    ...dataEffectif,
    organisme_id: organisme._id,
    _computed: addEffectifComputedFields(organisme),
  });

  const { insertedId } = await effectifsDb().insertOne(dataToInsert);

  return insertedId;
};

/**
 * Méthode d'insertion d'un effectif en base de donnée
 * @returns
 */
export const insertEffectif = async (data: Effectif) => {
  const { insertedId } = await effectifsDb().insertOne(data);
  return { _id: insertedId, ...data };
};

/**
 * Méthode de récupération des effectifs d'un organisme
 * @param {*} organisme_id
 * @param {*} projection
 * @returns
 */
export const findEffectifs = async (organisme_id, projection = {}) => {
  return await effectifsDb()
    .find({ organisme_id: new ObjectId(organisme_id) }, { projection })
    .toArray();
};

/**
 * Méthode de récupération d'un effectif versatile par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findEffectifByQuery = async (query, projection = {}) => {
  return await effectifsDb().findOne(query, { projection });
};

/**
 * Méthode de récupération d'un effectif depuis un id
 * @param {string|ObjectId} id
 * @param {*} projection
 * @returns
 */
export const findEffectifById = async (id, projection = {}) => {
  const found = await effectifsDb().findOne({ _id: new ObjectId(id) }, { projection });
  return found;
};

/**
 * Méthode de mise à jour d'un effectif depuis son id
 * @param {*} id
 * @returns
 */
export const updateEffectif = async (_id: ObjectId, data, opt = { keepPreviousErrors: false }) => {
  const effectif = await effectifsDb().findOne({ _id });
  if (!effectif) {
    throw new Error(`Unable to find effectif ${_id.toString()}`);
  }

  const updated = await effectifsDb().findOneAndUpdate(
    { _id: effectif._id },
    {
      $set: {
        ...data,
        ...(opt.keepPreviousErrors
          ? {
              validation_errors: uniqBy(
                [...(effectif.validation_errors || []), ...(data.validation_errors || [])],
                "fieldName"
              ),
            }
          : {}),
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de mise à jour d'un effectif avec lock
 * @param {*} effectif
 * @returns
 */
export const lockEffectif = async (effectif: WithId<Effectif>) => {
  const { apprenant, formation } = effectif;

  // Lock field
  let newLocker = { ...effectif.is_lock };
  const flattenKeys = (obj: any, path: any = []) =>
    !isObject(obj)
      ? { [path.join(".")]: obj }
      : reduce(obj, (cum, next, key) => merge(cum, flattenKeys(next, [...path, key])), {});
  const updatePaths = Object.keys(flattenKeys({ apprenant, formation }));

  // Handle manually array fields
  const updatePathsFiltered = updatePaths
    .filter((item) => !item.includes("apprenant.historique_statut"))
    .filter((item) => !item.includes("contrats"))
    .filter((item) => !item.includes("formation.periode"));

  for (const path of updatePathsFiltered) {
    set(newLocker, path, true);
  }

  // Handle manually locked fields
  // TODO Fix flattenKeys function for handling properly
  set(newLocker, "apprenant.date_de_naissance", true);
  set(newLocker, "apprenant.historique_statut", true);
  set(newLocker, "contrats", true);
  set(newLocker, "formation.periode", true);

  const updated = await effectifsDb().findOneAndUpdate(
    { _id: effectif._id },
    {
      $set: {
        is_lock: newLocker,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Récupération du nb distinct d'organismes transmettant des effectifs (distinct organisme_id dans la collection effectifs)
 */
export const getNbDistinctOrganismes = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const filterStages = buildMongoPipelineFilterStages(filtersWithRestriction);
  const distinctOrganismes = await effectifsDb()
    .aggregate([
      ...filterStages,
      {
        $group: {
          _id: "$organisme_id",
        },
      },
    ])
    .toArray();
  return distinctOrganismes.length;
};

export const addEffectifComputedFields = (organisme: Organisme): Effectif["_computed"] => {
  return {
    organisme: {
      ...(organisme.adresse?.region ? { region: organisme.adresse.region } : {}),
      ...(organisme.adresse?.departement ? { departement: organisme.adresse.departement } : {}),
      ...(organisme.adresse?.academie ? { academie: organisme.adresse.academie } : {}),
      ...(organisme.adresse?.bassinEmploi ? { bassinEmploi: organisme.adresse.bassinEmploi } : {}),
      ...(organisme.uai ? { uai: organisme.uai } : {}),
      ...(organisme.siret ? { siret: organisme.siret } : {}),
      ...(organisme.reseaux ? { reseaux: organisme.reseaux } : {}),
      fiable: organisme.fiabilisation_statut === "FIABLE" && !organisme.ferme,
    },
  };
};
