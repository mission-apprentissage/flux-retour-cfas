import { cloneDeep, isObject, merge, reduce, set, uniqBy } from "lodash-es";
import { ObjectId } from "mongodb";
import { effectifsDb } from "../model/collections.js";
import { defaultValuesEffectif, validateEffectif } from "../model/effectifs.model/effectifs.model.js";
import { defaultValuesApprenant } from "../model/effectifs.model/parts/apprenant.part.js";
import { defaultValuesFormationEffectif } from "../model/effectifs.model/parts/formation.effectif.part.js";
import { transformToInternationalNumber } from "../validation/utils/frenchTelephoneNumber.js";
import { buildMongoPipelineFilterStages, EffectifsFilters } from "./helpers/filters.js";

/**
 * Méthode de build d'un effectif
 * @param {any} effectif
 * @param {boolean} lockAtCreate
 * @returns
 */
export const buildEffectif = (
  {
    organisme_id,
    annee_scolaire,
    source,
    id_erp_apprenant = null,
    validation_errors = [],
    apprenant: { nom, prenom, ...apprenant },
    formation: { cfd, ...formation },
  },
  lockAtCreate = false
) => {
  const _id_erp_apprenant = id_erp_apprenant ?? new ObjectId().toString();
  const defaultValues = defaultValuesEffectif({ lockAtCreate });
  return {
    ...defaultValues,
    apprenant: {
      nom,
      prenom,
      ...defaultValues.apprenant,
      ...apprenant,
    },
    formation: {
      cfd,
      ...defaultValues.formation,
      ...formation,
    },
    id_erp_apprenant: _id_erp_apprenant,
    organisme_id: new ObjectId(organisme_id),
    source,
    annee_scolaire,
    validation_errors,
  };
};
/**
 * Méthode de création d'un effectif
 * @param {Object} effectif
 * @param {string} effectif.organisme_id
 * @param {string} [effectif.annee_scolaire]
 * @param {string} [effectif.source]
 * @param {string|null} [effectif.id_erp_apprenant]
 * @param {Object} effectif.apprenant
 * @param {Object} effectif.formation
 * @param {any[]} [effectif.validation_errors]
 * @param {*} lockAtCreate
 * @returns
 */
export const createEffectif = async (
  { organisme_id, annee_scolaire, source, id_erp_apprenant = null, apprenant, formation, validation_errors = [] },
  lockAtCreate = false
) => {
  const dataToInsert = buildEffectif(
    { organisme_id, annee_scolaire, source, id_erp_apprenant, apprenant, formation, validation_errors },
    lockAtCreate
  );

  const { insertedId } = await effectifsDb().insertOne(validateEffectif(dataToInsert));

  return insertedId;
};

/**
 * Validation d'un object effectif
 * @param {*} effectif
 * @returns
 */
export const validateEffectifObject = (effectif) => {
  // Vérification si erreurs de validation sur l'effectif
  const effectifValidationErrors = validateEffectif(effectif, true);

  const compactObject = (val) => {
    const data = Array.isArray(val) ? val.filter(Boolean) : val;
    return Object.keys(data).reduce((acc, key) => {
      const value = data[key];
      if (!(value === undefined)) acc[key] = typeof value === "object" ? compactObject(value) : value;
      if (acc[key] === undefined) delete acc[key];
      return acc;
    }, val);
  };

  let effectifMandate = cloneDeep(effectif);
  for (const validationError of effectifValidationErrors) {
    set(effectifMandate, validationError.fieldName, undefined);

    if (
      validationError.fieldName.includes("apprenant.historique_statut") &&
      (validationError.fieldName.includes("valeur_statut") || validationError.fieldName.includes("date_statut"))
    ) {
      const [, index] =
        RegExp(/^apprenant.historique_statut\[([0-9]{1})\].(valeur_statut|date_statut)$/, "g").exec(
          validationError.fieldName
        ) || [];
      effectifMandate.apprenant.historique_statut = [
        ...effectifMandate.apprenant.historique_statut.slice(0, index),
        ...effectifMandate.apprenant.historique_statut.slice(index + 1),
      ];
    }
    if (
      validationError.fieldName.includes("apprenant.contrats") &&
      (validationError.fieldName.includes("date_debut") || validationError.fieldName.includes("date_fin"))
    ) {
      const [, index] =
        RegExp(/^apprenant.contrats\[([0-9]{1})\].(date_debut|date_fin)$/, "g").exec(validationError.fieldName) || [];
      effectifMandate.apprenant.contrats = [
        ...effectifMandate.apprenant.contrats.slice(0, index),
        ...effectifMandate.apprenant.contrats.slice(index + 1),
      ];
    }
  }

  // TODO Suppression des erreurs sur date de naissance si nécéssaire

  return { ...compactObject(effectifMandate), validation_errors: effectifValidationErrors };
};

/**
 * Méthode d'insertion d'un effectif en base de donnée
 * @returns
 */
export const insertEffectif = async (data) => {
  const dataSanitized = validateEffectif(data);
  const { insertedId } = await effectifsDb().insertOne(dataSanitized);
  return { _id: insertedId, ...dataSanitized };
};

/**
 * Création d'un objet effectif depuis les données d'un dossierApprenant
 * @param {*} dossiersApprenant
 * @returns
 */
export const structureEffectifFromDossierApprenant = (dossiersApprenant) => {
  const {
    annee_scolaire,
    source,
    id_erp_apprenant,

    formation_cfd: cfd,
    formation_rncp: rncp,
    libelle_long_formation: libelle_long,
    niveau_formation: niveau,
    niveau_formation_libelle: niveau_libelle,
    periode_formation: periode,
    annee_formation: annee,
    code_commune_insee_apprenant,
    contrat_date_debut,
    contrat_date_fin,
    contrat_date_rupture,
    nom_apprenant: nom,
    prenom_apprenant: prenom,
    ine_apprenant: ine,
    date_de_naissance_apprenant: date_de_naissance,
    email_contact: courriel,
    telephone_apprenant: telephone,

    historique_statut_apprenant: historique_statut,
  } = dossiersApprenant;

  return {
    ...(annee_scolaire ? { annee_scolaire } : {}),
    ...(source ? { source } : {}),
    ...(id_erp_apprenant ? { id_erp_apprenant } : {}),
    organisme_id: undefined,
    apprenant: {
      ...defaultValuesApprenant(),
      ...(ine ? { ine } : {}),
      ...(nom ? { nom } : {}),
      ...(prenom ? { prenom } : {}),
      ...(date_de_naissance ? { date_de_naissance } : {}),

      ...(courriel ? { courriel } : {}),
      ...(telephone ? { telephone: transformToInternationalNumber(telephone) } : {}),
      ...(historique_statut ? { historique_statut } : {}),
      // Build adresse with code_commune_insee
      ...(code_commune_insee_apprenant ? { adresse: { code_insee: code_commune_insee_apprenant } } : {}),
      // Construction d'une liste de contrat avec un seul élément matchant les 3 dates si nécessaire
      contrats:
        contrat_date_debut || contrat_date_fin || contrat_date_rupture
          ? [
              {
                ...(contrat_date_debut ? { date_debut: contrat_date_debut } : {}),
                ...(contrat_date_fin ? { date_fin: contrat_date_fin } : {}),
                ...(contrat_date_rupture ? { date_rupture: contrat_date_rupture } : {}),
              },
            ]
          : [],
    },
    formation: {
      ...defaultValuesFormationEffectif(),
      ...(cfd ? { cfd } : {}),
      ...(rncp ? { rncp } : {}),
      ...(libelle_long ? { libelle_long } : {}),
      ...(niveau ? { niveau } : {}),
      ...(niveau_libelle ? { niveau_libelle } : {}),
      ...(periode ? { periode } : {}),
      ...(annee ? { annee } : {}),
    },
  };
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
 * Méthode de récupération des effectifs par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findEffectifsByQuery = async (query, projection = {}) => {
  return effectifsDb().find(query, { projection }).toArray();
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
export const updateEffectif = async (id, data, opt = { keepPreviousErrors: false }) => {
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const effectif = await effectifsDb().findOne({ _id });
  if (!effectif) {
    throw new Error(`Unable to find effectif ${_id.toString()}`);
  }

  const updated = await effectifsDb().findOneAndUpdate(
    { _id: effectif._id },
    {
      $set: {
        ...validateEffectif(data),
        ...(opt.keepPreviousErrors
          ? {
              validation_errors: uniqBy(
                [...(effectif.validation_errors || []), ...(data.validation_errors || [])],
                "fieldName"
              ),
            }
          : {}),
        organisme_id: new ObjectId(data.organisme_id),
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de mise à jour d'un effectif avec lock
 * @param {*} id
 * @returns
 */
export const updateEffectifAndLock = async (id, { apprenant, formation, validation_errors = [] }) => {
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const effectif = await effectifsDb().findOne({ _id });
  if (!effectif) {
    throw new Error(`Unable to find effectif ${_id.toString()}`);
  }

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
    .filter((item) => !item.includes("apprenant.contrats"))
    .filter((item) => !item.includes("formation.periode"));

  for (const path of updatePathsFiltered) {
    set(newLocker, path, true);
  }

  // Handle manually locked fields
  // TODO Fix flattenKeys function for handling properly
  set(newLocker, "apprenant.date_de_naissance", true);
  set(newLocker, "apprenant.historique_statut", true);
  set(newLocker, "apprenant.contrats", true);
  set(newLocker, "formation.periode", true);

  const updated = await effectifsDb().findOneAndUpdate(
    { _id: effectif._id },
    {
      $set: {
        ...validateEffectif({ ...effectif, apprenant, formation }),
        validation_errors,
        is_lock: newLocker,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export const getNbDistinctOrganismes = async (filters: EffectifsFilters) => {
  const filterStages = buildMongoPipelineFilterStages(filters);
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
