import { isObject, merge, reduce, set } from "lodash-es";
import { ObjectId } from "mongodb";
import { effectifsDb } from "../model/collections.js";
import {
  defaultValuesEffectif,
  validateEffectif,
} from "../model/next.toKeep.models/effectifs.model/effectifs.model.js";
import { defaultValuesApprenant } from "../model/next.toKeep.models/effectifs.model/parts/apprenant.part.js";
import { defaultValuesFormationEffectif } from "../model/next.toKeep.models/effectifs.model/parts/formation.effectif.part.js";

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

  const { insertedId } = await effectifsDb().insertOne(validateEffectif(dataToInsert));

  return insertedId;
};

/**
 * Méthode de création d'un effectif depuis un dossierApprenant
 * @param {*} dossiersApprenant
 */
export const createEffectifFromDossierApprenant = async (dossiersApprenant) => {
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

    nom_apprenant: nom,
    prenom_apprenant: prenom,
    ine_apprenant: ine,
    date_de_naissance_apprenant: date_de_naissance,
    email_contact: courriel,
    telephone_apprenant: telephone,

    historique_statut_apprenant: historique_statut,
  } = dossiersApprenant;

  const effectifApprenant = {
    ...defaultValuesApprenant(),
    ...(ine ? { ine } : {}),
    ...(nom ? { nom } : {}),
    ...(prenom ? { prenom } : {}),
    ...(date_de_naissance ? { date_de_naissance } : {}),
    ...(courriel ? { courriel } : {}),
    ...(telephone ? { telephone } : {}),
    ...(historique_statut ? { historique_statut } : {}),
  };

  const formationApprenant = {
    ...defaultValuesFormationEffectif(),
    ...(cfd ? { cfd } : {}),
    ...(rncp ? { rncp } : {}),
    ...(libelle_long ? { libelle_long } : {}),
    ...(niveau ? { niveau } : {}),
    ...(niveau_libelle ? { niveau_libelle } : {}),
    ...(periode ? { periode } : {}),
    ...(annee ? { annee } : {}),
  };

  // Create effectif locked
  const effectifId = await createEffectif(
    {
      organisme_id,
      ...(annee_scolaire ? { annee_scolaire } : {}),
      ...(source ? { source } : {}),
      ...(id_erp_apprenant ? { id_erp_apprenant } : {}),
      apprenant: effectifApprenant,
      formation: formationApprenant,
    },
    true
  );

  const effectifCreated = await effectifsDb().findOne({ _id: effectifId });
  return effectifCreated;
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
    .filter((item) => !item.includes("formation.periode"));

  for (const path of updatePathsFiltered) {
    set(newLocker, path, true);
  }

  // Handle manually locked fields
  // TODO Fix flattenKeys function for handling properly
  set(newLocker, "apprenant.date_de_naissance", true);
  set(newLocker, "apprenant.historique_statut", true);
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
