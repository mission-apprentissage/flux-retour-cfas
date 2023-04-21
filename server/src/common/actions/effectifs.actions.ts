import { cloneDeep, isObject, merge, reduce, set, uniqBy } from "lodash-es";
import { ObjectId } from "mongodb";

import { checkIndicateursFiltersPermissions } from "./effectifs/effectifs.actions";
import { LegacyEffectifsFilters, buildMongoPipelineFilterStages } from "./helpers/filters";
import { getOrganismeById } from "./organismes/organismes.actions";

import { Effectif } from "@/common/model/@types/Effectif";
import { EffectifsQueue } from "@/common/model/@types/EffectifsQueue";
import { effectifsDb } from "@/common/model/collections";
import { defaultValuesEffectif, validateEffectif } from "@/common/model/effectifs.model/effectifs.model";
import { defaultValuesApprenant } from "@/common/model/effectifs.model/parts/apprenant.part";
import { defaultValuesFormationEffectif } from "@/common/model/effectifs.model/parts/formation.effectif.part";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { stripEmptyFields } from "@/common/utils/miscUtils";
import { transformToInternationalNumber } from "@/common/validation/utils/frenchTelephoneNumber";

/**
 * Méthode de build d'un effectif
 * @param {any} effectif
 * @param {boolean} lockAtCreate
 * @returns
 */
export const buildEffectif = (effectifData: Required<Effectif> & { organisme_id: ObjectId }, lockAtCreate = false) => {
  const defaultValues = defaultValuesEffectif({ lockAtCreate });
  return {
    ...defaultValues,
    ...effectifData,
    apprenant: {
      ...defaultValues.apprenant,
      ...effectifData.apprenant,
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
export const createEffectif = async (
  dataEffectif: Required<Effectif> & { organisme_id: ObjectId },
  lockAtCreate = false
) => {
  const dataToInsert = buildEffectif(dataEffectif, lockAtCreate);

  const organisme = await getOrganismeById(dataEffectif.organisme_id);
  (dataToInsert as any)._computed = {
    organisme: {
      region: organisme.adresse?.region,
      departement: organisme.adresse?.departement,
      academie: organisme.adresse?.academie,
      reseaux: organisme.reseaux,
      uai: organisme.uai,
      siret: organisme.siret,
    },
  };
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
  return { ...stripEmptyFields(effectifMandate), validation_errors: effectifValidationErrors };
};

/**
 * Méthode d'insertion d'un effectif en base de donnée
 * @returns
 */
export const insertEffectif = async (data: Effectif) => {
  const dataSanitized = validateEffectif(data);
  const { insertedId } = await effectifsDb().insertOne(dataSanitized);
  return { _id: insertedId, ...dataSanitized };
};

/**
 * Création d'un objet effectif depuis les données d'un dossierApprenant
 * @param {*} dossiersApprenant
 * @returns
 */
export const structureEffectifFromDossierApprenant = (dossiersApprenant: EffectifsQueue) => {
  const {
    annee_scolaire,
    source,
    id_erp_apprenant,
    id_formation: cfd,
    formation_rncp: rncp,
    libelle_long_formation: libelle_long,
    periode_formation: periode,
    annee_formation: annee,
    code_commune_insee_apprenant,
    contrat_date_debut,
    contrat_date_fin,
    contrat_date_rupture,
    statut_apprenant,
    date_metier_mise_a_jour_statut,
    nom_apprenant: nom,
    prenom_apprenant: prenom,
    ine_apprenant: ine,
    date_de_naissance_apprenant: date_de_naissance,
    email_contact: courriel,
    tel_apprenant: telephone,
  } = dossiersApprenant;

  return stripEmptyFields({
    annee_scolaire,
    source,
    id_erp_apprenant,
    apprenant: {
      ...defaultValuesApprenant(),
      historique_statut: [
        {
          valeur_statut: statut_apprenant,
          date_statut: new Date(date_metier_mise_a_jour_statut),
          date_reception: new Date(),
        },
      ],
      ine,
      nom,
      prenom,
      date_de_naissance,
      courriel,
      telephone: transformToInternationalNumber(telephone),
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
      cfd,
      rncp,
      libelle_long,
      // periode is sent as string "year1-year2" i.e. "2020-2022", we transform it to [2020-2022]
      periode: periode ? periode.split("-").map(Number) : [],
      annee,
    },
  });
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
export const updateEffectif = async (_id: ObjectId, data, opt = { keepPreviousErrors: false }) => {
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
