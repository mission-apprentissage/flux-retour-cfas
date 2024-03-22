import Boom from "boom";
import { cloneDeep, isObject, merge, mergeWith, reduce, set, uniqBy } from "lodash-es";
import { ObjectId } from "mongodb";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IOrganisme } from "shared/models/data/organismes.model";
import { cyrb53Hash, normalize } from "shared/utils/crypt";
import type { Paths } from "type-fest";

import { effectifsDb } from "@/common/model/collections";
import { defaultValuesEffectif } from "@/common/model/effectifs.model/effectifs.model";

import { stripEmptyFields } from "../utils/miscUtils";
import { IEffectifCreationSchema } from "../validation/effectifsCreationSchema";

import { legacySchema } from "./effectif.legacy_schema";
import { getOrganismeById } from "./organismes/organismes.actions";
/**
 * Méthode de build d'un effectif
 *
 * Dans le cas d'un effectif téléversé, on ne veut pas verrouiller les champs, même ceux dits "par défaut" (nom, prénom, etc.)
 * Voir aussi la méthode lockEffectif
 */
export const mergeEffectifWithDefaults = <T extends Partial<IEffectif>>(effectifData: T, lockData: boolean = true) => {
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
      ...(lockData ? defaultValues.is_lock : { apprenant: {}, formation: {} }),
      ...effectifData.is_lock,
    },
    formation: {
      ...defaultValues.formation,
      ...effectifData.formation,
    },
  };
};

/**
 * Méthode de mise à jour d'un effectif depuis son id
 */
export const updateEffectif = async (_id: ObjectId, data: any, opt = { keepPreviousErrors: false }) => {
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

export function flatPathsWithoutEmpty<T>(object: T): Paths<T>[] {
  const flattenKeys = (obj: unknown, path: string[] = []): Record<string, unknown> => {
    if (isObject(obj)) {
      return reduce(obj, (cum, next, key) => merge(cum, flattenKeys(next, [...path, key])), {});
    }

    return obj !== "" && obj !== null && obj !== undefined ? { [path.join(".")]: obj } : {};
  };

  return Object.keys(flattenKeys(object)) as Paths<T>[];
}

/**
 * Méthode de mise à jour d'un effectif avec lock
 */
export const lockEffectif = async (effectif: IEffectif) => {
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

export const addEffectifComputedFields = (organisme: IOrganisme): IEffectif["_computed"] => {
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

  // Le numero d'adresse est parfois envoyé en string, bloquant toute la mise à jour de l'effectif
  // Si le numéro est présent, forcer le numéro a un nombre
  if (dataToUpdate.apprenant.adresse.numero) {
    const numero = Number(dataToUpdate.apprenant.adresse.numero);
    dataToUpdate.apprenant.adresse.numero = !isNaN(numero) ? numero : null;
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
      date_statut: new Date(nouveau_statut.date_statut),
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
  const { properties: effectifSchema } = legacySchema;

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

export const createEffectifFromForm = async (data: IEffectifCreationSchema, organismeId: string) => {
  const id_erp_apprenant = cyrb53Hash(
    normalize(data.apprenant.prenom || "").trim() +
      normalize(data.apprenant.nom || "").trim() +
      (data.apprenant.date_de_naissance?.toString() || "").trim()
  );

  const organismeLieuId = new ObjectId(data.organisme.organisme_lieu_id);
  const organismeFormationId = new ObjectId(data.organisme.organisme_formateur_id);
  const organismeResponsableId = new ObjectId(data.organisme.organisme_responsable_id);

  const organismeLieu = await getOrganismeById(organismeLieuId);

  const newEffectif: IEffectif = {
    _id: new ObjectId(),
    source: "formulaire",
    source_organisme_id: organismeId.toString(),
    annee_scolaire: data.annee_scolaire,
    validation_errors: [],
    organisme_id: organismeLieuId,
    organisme_responsable_id: organismeResponsableId,
    organisme_formateur_id: organismeFormationId,
    id_erp_apprenant,
    apprenant: {
      ...data.apprenant,
      historique_statut: [],
    },
    is_lock: {
      apprenant: {},
      formation: {},
    },
    formation: data.formation,
    contrats: data.contrats,
    created_at: new Date(),
    updated_at: new Date(),
    _computed: addEffectifComputedFields(organismeLieu),
  };

  // To be compliant to the unique indexes
  const found = !!(await effectifsDb().findOne({
    organisme_id: newEffectif.organisme_id,
    annee_scolaire: newEffectif.annee_scolaire,
    id_erp_apprenant: newEffectif.id_erp_apprenant,
    "apprenant.nom": newEffectif.apprenant.nom,
    "apprenant.prenom": newEffectif.apprenant.prenom,
    "formation.cfd": newEffectif.formation?.cfd,
    "formation.annee": newEffectif.formation?.annee,
  }));
  // if (found) {
  //   throw
  // }
  await effectifsDb().insertOne(newEffectif);
  return;
};
