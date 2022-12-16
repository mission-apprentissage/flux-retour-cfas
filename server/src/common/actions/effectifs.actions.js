import { isObject, merge, reduce, set } from "lodash-es";
import { ObjectId } from "mongodb";
import { effectifsDb } from "../model/collections.js";
import {
  schema as effectifSchema,
  defaultValuesEffectif,
  validateEffectif,
} from "../model/next.toKeep.models/effectifs.model/effectifs.model.js";
import { defaultValuesApprenant } from "../model/next.toKeep.models/effectifs.model/parts/apprenant.part.js";
import { defaultValuesFormationEffectif } from "../model/next.toKeep.models/effectifs.model/parts/formation.effectif.part.js";
import { getSchemaValidationErrors } from "../utils/schemaUtils.js";
import { transformToInternationalNumber } from "../utils/validationsUtils/frenchTelephoneNumber.js";

/**
 * Méthode de création d'un effectif
 * @returns
 */
export const createEffectif = async (
  { organisme_id, annee_scolaire, source, id_erp_apprenant = null, apprenant, formation },
  lockAtCreate = false
) => {
  const _id_erp_apprenant = id_erp_apprenant ?? new ObjectId().toString();
  const defaultValues = defaultValuesEffectif({ lockAtCreate });
  const dataToInsert = {
    ...defaultValues,
    apprenant,
    formation,
    id_erp_apprenant: _id_erp_apprenant,
    organisme_id: ObjectId(organisme_id),
    source,
    annee_scolaire,
  };

  const { insertedId } = await effectifsDb().insertOne(validateEffectif(dataToInsert));

  return insertedId;
};

/**
 * Méthode d'insertion d'un effectif en base de donnée
 * @returns
 */
export const insertEffectif = async (data) => {
  const { insertedId } = await effectifsDb().insertOne(validateEffectif(data));
  return insertedId;
};

/**
 * Méthode de création d'un effectif depuis un dossierApprenant
 * @param {*} dossiersApprenant
 */
export const createEffectifFromDossierApprenant = async (dossiersApprenant, lockAtCreate = false) => {
  const {
    organisme_id,
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

  // Construction d'une liste de contrat avec un seul élément matchant les 3 dates si nécessaire
  const contrats =
    contrat_date_debut || contrat_date_fin || contrat_date_rupture
      ? [
          {
            ...(contrat_date_debut ? { date_debut: contrat_date_debut } : {}),
            ...(contrat_date_fin ? { date_fin: contrat_date_fin } : {}),
            ...(contrat_date_rupture ? { date_rupture: contrat_date_rupture } : {}),
          },
        ]
      : [];

  const apprenantEffectif = {
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
    // Build contrats si nécessaire
    contrats,
  };

  const formationEffectif = {
    ...defaultValuesFormationEffectif(),
    ...(cfd ? { cfd } : {}),
    ...(rncp ? { rncp } : {}),
    ...(libelle_long ? { libelle_long } : {}),
    ...(niveau ? { niveau } : {}),
    ...(niveau_libelle ? { niveau_libelle } : {}),
    ...(periode ? { periode } : {}),
    ...(annee ? { annee } : {}),
  };

  const effectifData = {
    organisme_id,
    ...(annee_scolaire ? { annee_scolaire } : {}),
    ...(source ? { source } : {}),
    ...(id_erp_apprenant ? { id_erp_apprenant } : {}),
    apprenant: apprenantEffectif,
    formation: formationEffectif,
  };

  // Si pas d'erreurs on créé effectif avec lock option
  const effectifId = await createEffectif(effectifData, lockAtCreate);

  const effectifCreated = await effectifsDb().findOne({ _id: effectifId });
  return effectifCreated;
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

  // Construction d'une liste de contrat avec un seul élément matchant les 3 dates si nécessaire
  const contrats =
    contrat_date_debut || contrat_date_fin || contrat_date_rupture
      ? [
          {
            ...(contrat_date_debut ? { date_debut: contrat_date_debut } : {}),
            ...(contrat_date_fin ? { date_fin: contrat_date_fin } : {}),
            ...(contrat_date_rupture ? { date_rupture: contrat_date_rupture } : {}),
          },
        ]
      : [];

  const apprenantEffectif = {
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
    // Build contrats si nécessaire
    contrats,
  };

  const formationEffectif = {
    ...defaultValuesFormationEffectif(),
    ...(cfd ? { cfd } : {}),
    ...(rncp ? { rncp } : {}),
    ...(libelle_long ? { libelle_long } : {}),
    ...(niveau ? { niveau } : {}),
    ...(niveau_libelle ? { niveau_libelle } : {}),
    ...(periode ? { periode } : {}),
    ...(annee ? { annee } : {}),
  };

  return {
    ...(annee_scolaire ? { annee_scolaire } : {}),
    ...(source ? { source } : {}),
    ...(id_erp_apprenant ? { id_erp_apprenant } : {}),
    apprenant: apprenantEffectif,
    formation: formationEffectif,
  };
};

/**
 * Création d'un object effectif avec valeurs default
 * ajoute les valeurs corrigées et validation erreurs si erreurs présentes
 * @param {*} effectif
 * @returns
 */
export const structureEffectifWithEventualErrors = (effectif) => {
  // Vérification si erreurs de validation sur l'effectif
  const effectifValidationErrors = getSchemaValidationErrors(effectif, effectifSchema);
  const defaultValues = defaultValuesEffectif({ lockAtCreate: false });

  if (effectifValidationErrors.length > 0) {
    // On remplace chaque field en erreur par un field valide default, sinon on le remove
    for (const validationError of effectifValidationErrors) {
      const defaultInError = defaultValues[validationError.fieldName];
      if (defaultInError !== undefined) {
        effectif[validationError.fieldName] = defaultInError;
      } else {
        delete effectif[validationError.fieldName];
      }
    }
  }

  return { ...defaultValues, ...effectif, validation_errors: effectifValidationErrors };
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
  const found = await effectifsDb().findOne({ _id: ObjectId(id) }, { projection });
  return found;
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
  const updated = await effectifsDb().findOneAndUpdate(
    { _id: effectif._id },
    {
      $set: {
        ...validateEffectif(data),
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
export const updateEffectifAndLock = async (id, { apprenant, formation }) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const effectif = await effectifsDb().findOne({ _id });
  if (!effectif) {
    throw new Error(`Unable to find effectif ${_id.toString()}`);
  }

  // Lock field
  let newLocker = { ...effectif.is_lock };
  const flattenKeys = (obj, path = []) =>
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
        ...validateEffectif({ apprenant, formation }),
        is_lock: newLocker,
        updated_at: new Date(),
      },
    },
    { returnDocument: "after" }
  );

  return updated.value;
};
