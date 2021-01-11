const { StatutCandidat } = require("../model");
const logger = require("../logger");
const { codesMajStatutsInterdits, codesStatutsMajStatutCandidats } = require("../model/constants");
const { validateUai } = require("../domain/uai");
const { asyncForEach } = require("../../common/utils/asyncUtils");

module.exports = () => ({
  existsStatut,
  getStatut,
  addOrUpdateStatuts,
  getStatutHistory,
});

const existsStatut = async ({
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
  siret_etablissement,
}) => {
  const query = getFindStatutQuery(
    ine_apprenant,
    nom_apprenant,
    prenom_apprenant,
    prenom2_apprenant,
    prenom3_apprenant,
    email_contact,
    id_formation,
    uai_etablissement,
    siret_etablissement
  );
  const count = await StatutCandidat.countDocuments(query);
  return count !== 0;
};

const getStatut = async ({
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
  siret_etablissement,
}) => {
  const query = getFindStatutQuery(
    ine_apprenant,
    nom_apprenant,
    prenom_apprenant,
    prenom2_apprenant,
    prenom3_apprenant,
    email_contact,
    id_formation,
    uai_etablissement,
    siret_etablissement
  );
  const found = await StatutCandidat.findOne(query);
  return found;
};

const addOrUpdateStatuts = async (itemsToAddOrUpdate) => {
  const added = [];
  const updated = [];

  await asyncForEach(itemsToAddOrUpdate, async (item) => {
    // If status found update it
    const foundItem = await getStatut({
      ine_apprenant: item.ine_apprenant,
      nom_apprenant: item.nom_apprenant,
      prenom_apprenant: item.prenom_apprenant,
      prenom2_apprenant: item.prenom2_apprenant,
      prenom3_apprenant: item.prenom3_apprenant,
      email_contact: item.email_contact,
      id_formation: item.id_formation,
      uai_etablissement: item.uai_etablissement,
      siret_etablissement: item.siret_etablissement,
    });

    // log when uai is not valid
    const isUaiValid = validateUai(item.uai_etablissement);
    !isUaiValid && logger.warn(`Invalid UAI "${item.uai_etablissement}" detected. Will add or update anyway.`);

    if (foundItem) {
      const updatedItem = await updateStatut(foundItem._id, item);
      await updated.push(updatedItem);
    } else {
      const toAdd = new StatutCandidat({
        ine_apprenant: item.ine_apprenant,
        nom_apprenant: item.nom_apprenant,
        prenom_apprenant: item.prenom_apprenant,
        prenom2_apprenant: item.prenom2_apprenant,
        prenom3_apprenant: item.prenom3_apprenant,
        ne_pas_solliciter: item.ne_pas_solliciter,
        email_contact: item.email_contact,
        nom_representant_legal: item.nom_representant_legal,
        tel_representant_legal: item.tel_representant_legal,
        tel2_representant_legal: item.tel2_representant_legal,
        id_formation: item.id_formation,
        libelle_court_formation: item.libelle_court_formation,
        libelle_long_formation: item.libelle_long_formation,
        uai_etablissement: item.uai_etablissement,
        siret_etablissement: item.siret_etablissement,
        nom_etablissement: item.nom_etablissement,
        statut_apprenant: item.statut_apprenant,
        historique_statut_apprenant: [
          {
            valeur_statut: item.statut_apprenant,
            position_statut: 1,
            date_statut: new Date(),
          },
        ],
        date_entree_statut: item.date_entree_statut,
        date_saisie_statut: item.date_saisie_statut,
        date_mise_a_jour_statut: item.date_mise_a_jour_statut,
        date_metier_mise_a_jour_statut: item.date_metier_mise_a_jour_statut,
        source: item.source,
      });
      const addedItem = await toAdd.save();
      added.push(addedItem);
    }
  });

  return {
    added,
    updated,
  };
};

const getStatutHistory = async ({
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
  siret_etablissement,
}) => {
  const query = getFindStatutQuery(
    ine_apprenant,
    nom_apprenant,
    prenom_apprenant,
    prenom2_apprenant,
    prenom3_apprenant,
    email_contact,
    id_formation,
    uai_etablissement,
    siret_etablissement
  );
  const found = await StatutCandidat.findOne(query);
  return found ? found.historique_statut_apprenant : null;
};

const updateStatut = async (existingItemId, toUpdate) => {
  if (!existingItemId) return null;

  const existingItem = await StatutCandidat.findById(existingItemId);

  // Check if maj statut is valid
  if (isMajStatutInvalid(existingItem.statut_apprenant, toUpdate.statut_apprenant)) {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ko;
    toUpdate.erreur_mise_a_jour_statut = {
      date_mise_a_jour_statut: new Date(),
      ancien_statut: existingItem.statut_apprenant,
      nouveau_statut_souhaite: toUpdate.statut_apprenant,
    };
  } else {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ok;
  }

  // statut_apprenant has changed?
  if (existingItem.statut_apprenant !== toUpdate.statut_apprenant) {
    toUpdate.date_mise_a_jour_statut = new Date();

    toUpdate.historique_statut_apprenant = [
      ...existingItem.historique_statut_apprenant,
      {
        valeur_statut: toUpdate.statut_apprenant,
        position_statut: existingItem.historique_statut_apprenant.length + 1,
        date_statut: new Date(),
      },
    ];
  }

  // Update & return
  const updateQuery = {
    ...toUpdate,
    updated_at: new Date(),
  };
  const updated = await StatutCandidat.findByIdAndUpdate(existingItemId, updateQuery, { new: true });
  return updated;
};

const getFindStatutQuery = (
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
  siret_etablissement
) =>
  ine_apprenant
    ? {
        ine_apprenant: ine_apprenant,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
        siret_etablissement: siret_etablissement,
      }
    : {
        nom_apprenant: nom_apprenant,
        prenom_apprenant: prenom_apprenant,
        prenom2_apprenant: prenom2_apprenant,
        prenom3_apprenant: prenom3_apprenant,
        email_contact: email_contact,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
        siret_etablissement: siret_etablissement,
      };

const isMajStatutInvalid = (statutSource, statutDest) => {
  return codesMajStatutsInterdits.some((x) => x.source === statutSource && x.destination === statutDest);
};
