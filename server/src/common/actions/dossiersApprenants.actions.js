import { ObjectId } from "mongodb";
import { isEqual } from "date-fns";
import { dossiersApprenantsMigrationDb } from "../model/collections.js";
import {
  defaultValuesDossiersApprenantsMigration,
  validateDossiersApprenantsMigration,
} from "../model/next.toKeep.models/dossiersApprenantsMigration.model.js";
import { escapeRegExp } from "../utils/regexUtils.js";
import { findOrganismeById } from "./organismes/organismes.actions.js";

/**
 * Méthode qui ajoute un dossierApprenant en base
 * @param {*} data
 * @returns
 */
export const insertDossierApprenant = async (data) => {
  const { insertedId } = await dossiersApprenantsMigrationDb().insertOne(validateDossiersApprenantsMigration(data));
  return insertedId;
};

/**
 * Méthode qui construit un dossierApprenant et toutes les données liées
 * @param {*} param0
 */
export const structureDossierApprenant = async ({
  organisme_id,
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  contrat_date_debut,
  contrat_date_fin,
  contrat_date_rupture,
  uai_etablissement,
  siret_etablissement,
  ...data
}) => {
  // TODO Gestion de l'historique des statuts cf. createDossierApprenantLegacy
  // [
  //   {
  //     valeur_statut: itemToCreate.statut_apprenant,
  //     date_statut: new Date(itemToCreate.date_metier_mise_a_jour_statut),
  //     date_reception: new Date(),
  //   },
  // ],

  // Si on nous fourni un organisme_id existant on récupère le siret pour la structure
  if (organisme_id) {
    const organismeExistant = await findOrganismeById(organisme_id);
    siret_etablissement = organismeExistant?.siret;
  }

  return {
    ...defaultValuesDossiersApprenantsMigration(),
    organisme_id,
    uai_etablissement,
    siret_etablissement,
    ...(nom_apprenant ? { nom_apprenant: nom_apprenant.toUpperCase().trim() } : {}),
    ...(prenom_apprenant ? { prenom_apprenant: prenom_apprenant.toUpperCase().trim() } : {}),
    ...(date_de_naissance_apprenant
      ? {
          date_de_naissance_apprenant:
            date_de_naissance_apprenant instanceof Date
              ? date_de_naissance_apprenant
              : new Date(date_de_naissance_apprenant),
        }
      : {}),
    ...(contrat_date_debut
      ? { contrat_date_debut: contrat_date_debut instanceof Date ? contrat_date_debut : new Date(contrat_date_debut) }
      : {}),
    ...(contrat_date_fin
      ? { contrat_date_fin: contrat_date_fin instanceof Date ? contrat_date_fin : new Date(contrat_date_fin) }
      : {}),
    ...(contrat_date_rupture
      ? {
          contrat_date_rupture:
            contrat_date_rupture instanceof Date ? contrat_date_rupture : new Date(contrat_date_rupture),
        }
      : {}),
    ...data,
  };
};

/**
 * Méthode de récupération d'un dossierApprennant versatile par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findDossierApprenantByQuery = async (query, projection = {}) => {
  return await dossiersApprenantsMigrationDb().findOne(query, { projection });
};

/**
 * Méthode de récupération de dossierApprennants versatile par query
 * @param {*} query
 * @param {*} projection
 * @returns
 */
export const findDossierApprenantsByQuery = async (query, projection = {}) => {
  return await dossiersApprenantsMigrationDb().find(query, { projection }).toArray();
};

/**
 * Méthode de récupération d'un dossierApprennant par apprenant info et autres
 * @param {*} apprenantFieldsAndQuery
 * @returns
 */
export function findDossierApprenantByApprenant({
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  ...query
}) {
  const nomApprenantRegexp = new RegExp(`^${escapeRegExp(nom_apprenant.trim())}$`, "i");
  const prenomApprenantRegexp = new RegExp(`^${escapeRegExp(prenom_apprenant.trim())}$`, "i");

  return dossiersApprenantsMigrationDb().findOne({
    nom_apprenant: { $regex: nomApprenantRegexp },
    prenom_apprenant: { $regex: prenomApprenantRegexp },
    date_de_naissance_apprenant:
      date_de_naissance_apprenant instanceof Date ? date_de_naissance_apprenant : new Date(date_de_naissance_apprenant),
    ...query,
  });
}

/**
 * Méthode de mise à jour d'un dossierApprennant depuis son id
 * TODO : Voir ou l'on on update effectif lié
 * @param {*} id
 * @returns
 */
export const updateDossierApprenant = async (
  id,
  {
    contrat_date_debut,
    contrat_date_fin,
    contrat_date_rupture,
    formation_id,
    statut_apprenant,
    date_metier_mise_a_jour_statut,
    ...data
  }
) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const dossiersApprenant = await dossiersApprenantsMigrationDb().findOne({ _id });
  if (!dossiersApprenant) {
    throw new Error(`Unable to find dossiersApprenant ${_id.toString()}`);
  }

  let updateQuery = {
    nom_apprenant: dossiersApprenant.nom_apprenant, // required
    prenom_apprenant: dossiersApprenant.prenom_apprenant, // required
    formation_cfd: dossiersApprenant.formation_cfd, // required
    annee_scolaire: dossiersApprenant.annee_scolaire, // required
    ...(contrat_date_debut
      ? { contrat_date_debut: contrat_date_debut instanceof Date ? contrat_date_debut : new Date(contrat_date_debut) }
      : {}),
    ...(contrat_date_fin
      ? { contrat_date_fin: contrat_date_fin instanceof Date ? contrat_date_fin : new Date(contrat_date_fin) }
      : {}),
    ...(contrat_date_rupture
      ? {
          contrat_date_rupture:
            contrat_date_rupture instanceof Date ? contrat_date_rupture : new Date(contrat_date_rupture),
        }
      : {}),
    ...(formation_id ? { formation_id } : {}), // Handle formation_id undefined
    ...data,
    organisme_id: dossiersApprenant.organisme_id, // required do not modify ever // Discutable
    id_erp_apprenant: dossiersApprenant.id_erp_apprenant, // required do not modify ever
    uai_etablissement: dossiersApprenant.uai_etablissement, // required do not modify ever
    siret_etablissement: dossiersApprenant.siret_etablissement, // required do not modify ever
    source: dossiersApprenant.source, // required do not modify ever
  };

  // Construction de l'historique mis à jour
  const updatedHistorique = await buildNewHistoriqueStatutApprenant(
    dossiersApprenant.historique_statut_apprenant,
    statut_apprenant,
    date_metier_mise_a_jour_statut
  );

  const updated = await dossiersApprenantsMigrationDb().findOneAndUpdate(
    { _id: dossiersApprenant._id },
    {
      $set: validateDossiersApprenantsMigration({
        ...updateQuery,
        historique_statut_apprenant: updatedHistorique,
        updated_at: new Date(),
      }),
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

/**
 * Méthode de construction d'un nouveau tableau d'historique de statut
 * a partir d'un nouveau couple statut / date_metier
 * Va append au tableau un nouvel élément si nécessaire
 * @param {*} historique_statut_apprenant_existant
 * @param {*} updated_statut_apprenant
 * @param {*} updated_date_metier_mise_a_jour_statut
 * @returns
 */
export const buildNewHistoriqueStatutApprenant = (
  historique_statut_apprenant_existant,
  updated_statut_apprenant,
  updated_date_metier_mise_a_jour_statut
) => {
  if (!updated_statut_apprenant) return historique_statut_apprenant_existant;

  let newHistoriqueStatutApprenant = historique_statut_apprenant_existant;

  // Vérification si le nouveau statut existe déja dans l'historique actuel
  const statutExistsInHistorique = historique_statut_apprenant_existant.find((historiqueItem) => {
    return (
      historiqueItem.valeur_statut === updated_statut_apprenant &&
      isEqual(new Date(historiqueItem.date_statut), new Date(updated_date_metier_mise_a_jour_statut))
    );
  });

  // Si le statut n'existe pas déja on l'ajoute
  if (!statutExistsInHistorique) {
    const newHistoriqueElement = {
      valeur_statut: updated_statut_apprenant,
      date_statut: new Date(updated_date_metier_mise_a_jour_statut),
      date_reception: new Date(),
    };

    // add new element to historique
    const historique = historique_statut_apprenant_existant.slice();
    historique.push(newHistoriqueElement);

    // sort historique chronologically
    const historiqueSorted = historique.sort((a, b) => {
      return a.date_statut.getTime() - b.date_statut.getTime();
    });

    // find new element index in sorted historique to remove subsequent ones
    const newElementIndex = historiqueSorted.findIndex((el) => el.date_statut === newHistoriqueElement.date_statut);
    newHistoriqueStatutApprenant = historiqueSorted.slice(0, newElementIndex + 1);
  }

  return newHistoriqueStatutApprenant;
};

/**
 * Récupération du nb distinct d'organismes via leurs UAI
 // TODO voir si on garde ici ou dans un utils ?
 * @param {*} filters
 * @returns
 */
export const getNbDistinctOrganismesByUai = async (filters = {}) => {
  const distinctCfas = await dossiersApprenantsMigrationDb().distinct("uai_etablissement", filters);
  return distinctCfas ? distinctCfas.length : 0;
};

/**
 * TODO add to unit tests
 * Returns the first date of dossierApprenant transmission for a UAI
 * @param {*} uai
 * @returns
 */
export const getCfaFirstTransmissionDateFromUai = async (uai) => {
  const historiqueDatesDossierApprenantWithUai = await dossiersApprenantsMigrationDb()
    .find({ uai_etablissement: uai })
    .sort("created_at")
    .limit(1)
    .toArray();

  return historiqueDatesDossierApprenantWithUai.length > 0
    ? historiqueDatesDossierApprenantWithUai[0].created_at
    : null;
};

/**
 * TODO add to unit tests
 * Returns the first date of dossierApprenant transmission for a SIRET
 * @param {*} uai
 * @returns {Date|null}
 */
export const getCfaFirstTransmissionDateFromSiret = async (siret) => {
  const historiqueDatesDossiersApprenantsWithSiret = await dossiersApprenantsMigrationDb()
    .find({ siret_etablissement: siret })
    .sort("created_at")
    .limit(1)
    .toArray();

  return historiqueDatesDossiersApprenantsWithSiret.length > 0
    ? historiqueDatesDossiersApprenantsWithSiret[0].created_at
    : null;
};
