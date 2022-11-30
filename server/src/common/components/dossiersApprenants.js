import { ObjectId } from "mongodb";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import { isEqual } from "date-fns";
import { DossierApprenant } from "../factory/dossierApprenant.js";
import { cfasDb, dossiersApprenantsDb } from "../model/collections.js";

/**
 * Find a dossier apprenant from unicity key params
 * @param {*} unicityFields
 * @returns
 */
const getDossierApprenant = async ({ id_erp_apprenant, uai_etablissement, annee_scolaire }) => {
  return await dossiersApprenantsDb().findOne({
    id_erp_apprenant,
    uai_etablissement,
    annee_scolaire,
  });
};

/**
 * Add or update items in a list of DossierApprenant
 * @param {*} itemsToAddOrUpdate
 * @returns
 */
const addOrUpdateDossiersApprenants = async (itemsToAddOrUpdate) => {
  const added = [];
  const updated = [];

  await asyncForEach(itemsToAddOrUpdate, async (item) => {
    // Search dossier apprenant with unicity fields
    const foundItem = await getDossierApprenant({
      id_erp_apprenant: item.id_erp_apprenant,
      uai_etablissement: item.uai_etablissement,
      annee_scolaire: item.annee_scolaire,
    });

    if (!foundItem) {
      const addedItem = await createDossierApprenant(item);
      added.push(addedItem);
    } else {
      const updatedItem = await updateDossierApprenant(foundItem._id, item);
      updated.push(updatedItem);
    }
  });

  return {
    added,
    updated,
  };
};

const updateDossierApprenant = async (existingItemId, toUpdate) => {
  if (!existingItemId) return null;
  const _id = new ObjectId(existingItemId);
  if (!ObjectId.isValid(_id)) throw new Error("Invalid id passed");

  const updateFieldsWhitelist = [
    "prenom_apprenant",
    "nom_apprenant",
    "formation_cfd",
    "date_de_naissance_apprenant",
    "nom_etablissement",
    "ine_apprenant",
    "email_contact",
    "tel_apprenant",
    "code_commune_insee_apprenant",
    "siret_etablissement",
    "libelle_long_formation",
    "periode_formation",
    "annee_formation",
    "formation_rncp",
    "contrat_date_debut",
    "contrat_date_fin",
    "contrat_date_rupture",
  ];
  const updateQuery = {
    updated_at: new Date(),
  };
  const existingItem = await dossiersApprenantsDb().findOne({ _id });

  updateFieldsWhitelist.forEach((field) => {
    updateQuery[field] = toUpdate[field];
  });
  // date fields update
  updateQuery.contrat_date_debut = toUpdate.contrat_date_debut && new Date(toUpdate.contrat_date_debut);
  updateQuery.contrat_date_fin = toUpdate.contrat_date_fin && new Date(toUpdate.contrat_date_fin);
  updateQuery.contrat_date_rupture = toUpdate.contrat_date_rupture && new Date(toUpdate.contrat_date_rupture);

  // historique_statut_apprenant update
  // new statut_apprenant to add ?
  const statutExistsInHistorique = existingItem.historique_statut_apprenant.find((historiqueItem) => {
    return (
      historiqueItem.valeur_statut === toUpdate.statut_apprenant &&
      isEqual(new Date(historiqueItem.date_statut), new Date(toUpdate.date_metier_mise_a_jour_statut))
    );
  });

  if (!statutExistsInHistorique) {
    const newHistoriqueElement = {
      valeur_statut: toUpdate.statut_apprenant,
      date_statut: new Date(toUpdate.date_metier_mise_a_jour_statut),
      date_reception: new Date(),
    };

    // add new element to historique
    const historique = existingItem.historique_statut_apprenant.slice();
    historique.push(newHistoriqueElement);
    // sort historique chronologically
    const historiqueSorted = historique.sort((a, b) => {
      return a.date_statut.getTime() - b.date_statut.getTime();
    });

    // find new element index in sorted historique to remove subsequent ones
    const newElementIndex = historiqueSorted.findIndex((el) => el.date_statut === newHistoriqueElement.date_statut);

    updateQuery.historique_statut_apprenant = historiqueSorted.slice(0, newElementIndex + 1);
  }

  await dossiersApprenantsDb().updateOne({ _id }, { $set: updateQuery });
  // TODO return nothing (single responsibility)
  return await dossiersApprenantsDb().findOne({ _id });
};

const createDossierApprenant = async (itemToCreate) => {
  // if dossier apprenant établissement has a VALID uai try to retrieve information in Referentiel CFAs
  const etablissementInReferentielCfaFromUai = await cfasDb().findOne({ uai: itemToCreate.uai_etablissement });

  const dossierApprenantEntity = DossierApprenant.create({
    ine_apprenant: itemToCreate.ine_apprenant,
    nom_apprenant: itemToCreate.nom_apprenant.toUpperCase(),
    prenom_apprenant: itemToCreate.prenom_apprenant.toUpperCase(),
    email_contact: itemToCreate.email_contact,
    formation_cfd: itemToCreate.formation_cfd,
    libelle_long_formation: itemToCreate.libelle_long_formation,
    uai_etablissement: itemToCreate.uai_etablissement,
    siret_etablissement: itemToCreate.siret_etablissement,
    nom_etablissement: itemToCreate.nom_etablissement,
    historique_statut_apprenant: [
      {
        valeur_statut: itemToCreate.statut_apprenant,
        date_statut: new Date(itemToCreate.date_metier_mise_a_jour_statut),
        date_reception: new Date(),
      },
    ],
    periode_formation: itemToCreate.periode_formation,
    annee_formation: itemToCreate.annee_formation,
    annee_scolaire: itemToCreate.annee_scolaire,
    id_erp_apprenant: itemToCreate.id_erp_apprenant,
    tel_apprenant: itemToCreate.tel_apprenant,
    code_commune_insee_apprenant: itemToCreate.code_commune_insee_apprenant,
    date_de_naissance_apprenant: itemToCreate.date_de_naissance_apprenant,
    contrat_date_debut: itemToCreate.contrat_date_debut,
    contrat_date_fin: itemToCreate.contrat_date_fin,
    contrat_date_rupture: itemToCreate.contrat_date_rupture,
    formation_rncp: itemToCreate.formation_rncp,
    source: itemToCreate.source,
    // add network of etablissement if found in ReferentielCfa
    ...(etablissementInReferentielCfaFromUai
      ? { etablissement_reseaux: etablissementInReferentielCfaFromUai.reseaux }
      : {}),
  });

  if (dossierApprenantEntity) {
    const { insertedId } = await dossiersApprenantsDb().insertOne(dossierApprenantEntity);
    // TODO return only the insertedId (single responsiblity)
    return await dossiersApprenantsDb().findOne({ _id: insertedId });
  }

  // TODO throw error if factory validation didn't pass
  return null;
};

export default () => ({
  getDossierApprenant,
  addOrUpdateDossiersApprenants,
  createDossierApprenant,
  updateDossierApprenant,
});
