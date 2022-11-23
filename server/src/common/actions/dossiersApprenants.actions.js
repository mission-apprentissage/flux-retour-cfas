import { ObjectId } from "mongodb";
import { isEqual } from "date-fns";
import { dossiersApprenantsMigrationDb } from "../model/collections.js";
import {
  defaultValuesDossiersApprenantsMigration,
  validateDossiersApprenantsMigration,
} from "../model/next.toKeep.models/dossiersApprenantsMigration.model.js";
import { escapeRegExp } from "../utils/regexUtils.js";

/**
 * Méthode de création d'un organisme
 * Checks uai format & existence
 * @param {*} organismeProps
 * @returns
 */
export const createDossierApprenant = async ({
  nom_apprenant,
  prenom_apprenant,
  date_de_naissance_apprenant,
  contrat_date_debut,
  contrat_date_fin,
  contrat_date_rupture,
  ...data
}) => {
  const { insertedId } = await dossiersApprenantsMigrationDb().insertOne(
    validateDossiersApprenantsMigration({
      ...defaultValuesDossiersApprenantsMigration(),
      ...(nom_apprenant ? { nom_apprenant: nom_apprenant.toUpperCase().trim() } : {}),
      ...(prenom_apprenant ? { nom_apprenant: prenom_apprenant.toUpperCase().trim() } : {}),
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
    })
  );

  return await dossiersApprenantsMigrationDb().findOne({ _id: insertedId });
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
  const nomApprenantRegexp = new RegExp("^" + escapeRegExp(nom_apprenant.trim()) + "$", "i");
  const prenomApprenantRegexp = new RegExp("^" + escapeRegExp(prenom_apprenant.trim()) + "$", "i");

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
 * @param {*} id
 * @returns
 */
export const updateDossierApprenant = async (
  id,
  { contrat_date_debut, contrat_date_fin, contrat_date_rupture, ...data }
) => {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const dossiersApprenant = await dossiersApprenantsMigrationDb().findOne({ _id });
  if (!dossiersApprenant) {
    throw new Error(`Unable to find dossiersApprenant ${_id.toString()}`);
  }

  let updateQuery = {
    id_erp_apprenant: dossiersApprenant.id_erp_apprenant, // required do not modify ever
    uai_etablissement: dossiersApprenant.uai_etablissement, // required do not modify ever
    source: dossiersApprenant.source, // required do not modify ever

    organisme_id: dossiersApprenant.organisme_id, // required do not modify ever // Discutable
    nom_apprenant: dossiersApprenant.nom_apprenant, // required do not modify ever // Discutable
    prenom_apprenant: dossiersApprenant.prenom_apprenant, // required do not modify ever // Discutable
    formation_cfd: dossiersApprenant.formation_cfd, // required do not modify ever // Discutable
    annee_scolaire: dossiersApprenant.annee_scolaire, // required do not modify ever // Discutable

    historique_statut_apprenant: dossiersApprenant.historique_statut_apprenant, // required

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

  const updated = await dossiersApprenantsMigrationDb().findOneAndUpdate(
    { _id: dossiersApprenant._id },
    {
      $set: validateDossiersApprenantsMigration({
        ...updateQuery,
        updated_at: new Date(),
      }),
    },
    { returnDocument: "after" }
  );

  return updated.value;
};

export async function buildNewHistoriqueStatutApprenantFromId(
  id,
  { statut_apprenant, date_metier_mise_a_jour_statut }
) {
  const _id = typeof id === "string" ? ObjectId(id) : id;
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const dossiersApprenant = await dossiersApprenantsMigrationDb().findOne({ _id });
  if (!dossiersApprenant) {
    throw new Error(`Unable to find dossiersApprenant ${_id.toString()}`);
  }

  let newHistoriqueStatutApprenant = dossiersApprenant.historique_statut_apprenant;

  // TODO new statut_apprenant to add ?
  const statutExistsInHistorique = dossiersApprenant.historique_statut_apprenant.find((historiqueItem) => {
    return (
      historiqueItem.valeur_statut === statut_apprenant &&
      isEqual(new Date(historiqueItem.date_statut), new Date(date_metier_mise_a_jour_statut))
    );
  });

  if (!statutExistsInHistorique) {
    const newHistoriqueElement = {
      valeur_statut: statut_apprenant,
      date_statut: new Date(date_metier_mise_a_jour_statut),
      date_reception: new Date(),
    };

    // add new element to historique
    const historique = dossiersApprenant.historique_statut_apprenant.slice();
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
}

// const createDossierApprenant = async (itemToCreate) => {
//   // if dossier apprenant établissement has a VALID uai try to retrieve information in Referentiel CFAs
//   const etablissementInReferentielCfaFromUai = await cfasDb().findOne({ uai: itemToCreate.uai_etablissement });

//   const dossierApprenantEntity = DossierApprenant.create({
//     ine_apprenant: itemToCreate.ine_apprenant,
//     nom_apprenant: itemToCreate.nom_apprenant.toUpperCase(),
//     prenom_apprenant: itemToCreate.prenom_apprenant.toUpperCase(),
//     email_contact: itemToCreate.email_contact,
//     formation_cfd: itemToCreate.formation_cfd,
//     libelle_long_formation: itemToCreate.libelle_long_formation,
//     uai_etablissement: itemToCreate.uai_etablissement,
//     siret_etablissement: itemToCreate.siret_etablissement,
//     nom_etablissement: itemToCreate.nom_etablissement,
//     historique_statut_apprenant: [
//       {
//         valeur_statut: itemToCreate.statut_apprenant,
//         date_statut: new Date(itemToCreate.date_metier_mise_a_jour_statut),
//         date_reception: new Date(),
//       },
//     ],
//     periode_formation: itemToCreate.periode_formation,
//     annee_formation: itemToCreate.annee_formation,
//     annee_scolaire: itemToCreate.annee_scolaire,
//     id_erp_apprenant: itemToCreate.id_erp_apprenant,
//     tel_apprenant: itemToCreate.tel_apprenant,
//     code_commune_insee_apprenant: itemToCreate.code_commune_insee_apprenant,
//     date_de_naissance_apprenant: itemToCreate.date_de_naissance_apprenant,
//     contrat_date_debut: itemToCreate.contrat_date_debut,
//     contrat_date_fin: itemToCreate.contrat_date_fin,
//     contrat_date_rupture: itemToCreate.contrat_date_rupture,
//     formation_rncp: itemToCreate.formation_rncp,
//     source: itemToCreate.source,
//     // add network of etablissement if found in ReferentielCfa
//     ...(etablissementInReferentielCfaFromUai
//       ? { etablissement_reseaux: etablissementInReferentielCfaFromUai.reseaux }
//       : {}),
//   });

//   if (dossierApprenantEntity) {
//     const { insertedId } = await dossiersApprenantsDb().insertOne(dossierApprenantEntity);
//     // TODO return only the insertedId (single responsiblity)
//     return await dossiersApprenantsDb().findOne({ _id: insertedId });
//   }

//   // TODO throw error if factory validation didn't pass
//   return null;
// };
