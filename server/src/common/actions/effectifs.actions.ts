import Boom from "boom";
import { cloneDeep, isObject, merge, mergeWith, reduce, set, uniqBy } from "lodash-es";
import { ObjectId, WithId } from "mongodb";

import { Effectif } from "@/common/model/@types/Effectif";
import { effectifsDb } from "@/common/model/collections";
import { defaultValuesEffectif, schema } from "@/common/model/effectifs.model/effectifs.model";

import { Organisme } from "../model/@types";
import { stripEmptyFields } from "../utils/miscUtils";

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

export function flatPathsWithoutEmpty(object: any) {
  const flattenKeys = (obj: any, path: any = []) =>
    !isObject(obj)
      ? obj !== "" && obj !== null && obj !== undefined
        ? { [path.join(".")]: obj }
        : {}
      : reduce(obj, (cum, next, key) => merge(cum, flattenKeys(next, [...path, key])), {});
  return Object.keys(flattenKeys(object));
}

/**
 * Méthode de mise à jour d'un effectif avec lock
 */
export const lockEffectif = async (effectif: WithId<Effectif>) => {
  const { apprenant, formation } = effectif;

  // Lock field
  let newLocker = { ...effectif.is_lock };
  const updatePaths = flatPathsWithoutEmpty({ apprenant, formation });

  // Handle manually array fields
  const updatePathsFiltered = updatePaths
    .filter((item) => !item.includes("apprenant.historique_statut"))
    .filter((item) => !item.includes("contrats"))
    .filter((item) => !item.includes("formation.periode"));

  for (const path of updatePathsFiltered) {
    set(newLocker, path, true);
  }

  // Handle manually locked fields
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

export async function getEffectifForm(effectifId: ObjectId): Promise<any> {
  const effectif = await effectifsDb().findOne({ _id: effectifId });
  return buildEffectifResult(effectif);
}

export async function updateEffectifFromForm(effectifId: ObjectId, body: any): Promise<any> {
  const { inputNames, ...data } = body; // TODO JOI (inputNames used to track user actions)

  const effectifDb = await effectifsDb().findOne({ _id: effectifId });
  if (!effectifDb) {
    throw Boom.notFound(`Unable to find effectif ${effectifId.toString()}`);
  }

  const { is_lock, nouveau_statut, nouveau_contrat, ...restData } = data;

  const { _id, id_erp_apprenant, organisme_id, annee_scolaire, source, updated_at, created_at, ...dataToUpdate } =
    merge(effectifDb, stripEmptyFields(restData));

  // TODO WEIRD MONGO VALIDATION ISSUE ONLY ON THOSE
  if (dataToUpdate.formation.date_entree) {
    dataToUpdate.formation.date_entree = new Date(dataToUpdate.formation.date_entree);
  }
  if (dataToUpdate.formation.date_fin) {
    dataToUpdate.formation.date_fin = new Date(dataToUpdate.formation.date_fin);
  }
  if (dataToUpdate.formation.date_inscription) {
    dataToUpdate.formation.date_inscription = new Date(dataToUpdate.formation.date_inscription);
  }
  if (dataToUpdate.formation.date_obtention_diplome) {
    dataToUpdate.formation.date_obtention_diplome = new Date(dataToUpdate.formation.date_obtention_diplome);
  }
  if (dataToUpdate.apprenant.date_rqth) {
    dataToUpdate.apprenant.date_rqth = new Date(dataToUpdate.apprenant.date_rqth);
  }
  if (dataToUpdate.apprenant.date_de_naissance) {
    dataToUpdate.apprenant.date_de_naissance = new Date(dataToUpdate.apprenant.date_de_naissance);
  }

  dataToUpdate.apprenant.historique_statut = dataToUpdate.apprenant.historique_statut
    .filter((e) => e) // Remove empty values
    .map((s) => {
      const statut = stripEmptyFields(s);
      if (statut.date_statut) {
        statut.date_statut = new Date(statut.date_statut);
      }
      if (statut.date_reception) {
        statut.date_reception = new Date(statut.date_reception);
      }
      return statut;
    });
  if (nouveau_statut) {
    dataToUpdate.apprenant.historique_statut.push({
      valeur_statut: nouveau_statut.valeur_statut,
      date_statut: nouveau_statut.date_statut,
      date_reception: new Date(),
    });
  }

  dataToUpdate.contrats = dataToUpdate.contrats
    .filter((e) => e) // Remove empty values
    .map((c) => {
      const contrat = stripEmptyFields(c);
      if (contrat.date_debut) {
        contrat.date_debut = new Date(contrat.date_debut);
      }
      if (contrat.date_fin) {
        contrat.date_fin = new Date(contrat.date_fin);
      }
      if (contrat.date_rupture) {
        contrat.date_rupture = new Date(contrat.date_rupture);
      }
      return contrat;
    });
  if (nouveau_contrat) {
    dataToUpdate.contrats.push(nouveau_contrat);
  }

  let validation_errors: any[] = [];
  for (const validation_error of dataToUpdate.validation_errors) {
    if (!inputNames.includes(validation_error.fieldName)) {
      validation_errors.push(validation_error);
    }
  }

  const effectifUpdated = await updateEffectif(effectifDb._id, {
    ...dataToUpdate,
    id_erp_apprenant,
    organisme_id: new ObjectId(organisme_id),
    annee_scolaire,
    source,
    validation_errors,
  });

  return buildEffectifResult(effectifUpdated);
}

function buildEffectifResult(effectif) {
  const { properties: effectifSchema } = schema;

  function customizer(objValue, srcValue) {
    if (objValue !== undefined) {
      return {
        ...objValue,
        value:
          srcValue || srcValue === false || srcValue === 0 ? srcValue : typeof objValue.type === "object" ? null : "",
      };
    }
  }

  function customizerLock(objValue, srcValue) {
    if (objValue !== undefined) {
      return { ...objValue, locked: srcValue };
    }
  }
  function customizerPath(objValue, srcValue) {
    if (objValue !== undefined) {
      return { ...objValue, path: srcValue };
    }
  }

  const flatPaths = Object.keys(flattenKeys(effectif.is_lock));
  let paths = cloneDeep(effectif.is_lock);
  for (const path of flatPaths) {
    set(paths, path, path);
  }

  return {
    apprenant: {
      ...mergeWith(
        mergeWith(
          mergeWith(cloneDeep(effectifSchema.apprenant.properties), effectif.apprenant, customizer),
          effectif.is_lock.apprenant,
          customizerLock
        ),
        paths.apprenant,
        customizerPath
      ),
      adresse: {
        ...mergeWith(
          mergeWith(
            mergeWith(
              cloneDeep(effectifSchema.apprenant.properties.adresse.properties),
              effectif.apprenant.adresse,
              customizer
            ),
            effectif.is_lock.apprenant.adresse,
            customizerLock
          ),
          paths.apprenant.adresse,
          customizerPath
        ),
      },
      representant_legal: {
        ...mergeWith(
          mergeWith(
            mergeWith(
              cloneDeep(effectifSchema.apprenant.properties.representant_legal.properties),
              effectif.apprenant.representant_legal,
              customizer
            ),
            effectif.is_lock.apprenant.representant_legal,
            customizerLock
          ),
          paths.apprenant.representant_legal,
          customizerPath
        ),
        adresse: {
          ...mergeWith(
            mergeWith(
              mergeWith(
                cloneDeep(effectifSchema.apprenant.properties.representant_legal.properties.adresse.properties),
                effectif.apprenant.representant_legal ? effectif.apprenant.representant_legal.adresse : {},
                customizer
              ),
              effectif.is_lock.apprenant.representant_legal?.adresse,
              customizerLock
            ),
            paths.apprenant.representant_legal?.adresse,
            customizerPath
          ),
        },
      },
    },
    formation: {
      ...mergeWith(
        mergeWith(
          mergeWith(cloneDeep(effectifSchema.formation.properties), effectif.formation, customizer),
          effectif.is_lock.formation,
          customizerLock
        ),
        paths.formation.adresse,
        customizerPath
      ),
    },
    contrats: {
      ...effectifSchema.contrats,
      value: effectif.contrats,
      locked: effectif.is_lock.contrats || false,
      path: paths.contrats,
    },
    annee_scolaire: effectif.annee_scolaire,
    id: effectif._id,
    organisme_id: effectif.organisme_id,
    id_erp_apprenant: effectif.id_erp_apprenant,
    source: effectif.source,
    validation_errors: effectif.validation_errors,
    updated_at: effectif.updated_at,
  };
}

const flattenKeys = (obj: any, path: any = []) =>
  !isObject(obj)
    ? { [path.join(".")]: obj }
    : reduce(obj, (cum, next, key) => merge(cum, flattenKeys(next, [...path, key])), {});
