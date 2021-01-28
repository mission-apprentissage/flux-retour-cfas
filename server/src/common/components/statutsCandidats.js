const { StatutCandidat } = require("../model");
const { codesMajStatutsInterdits, codesStatutsMajStatutCandidats } = require("../model/constants");
const { validateUai } = require("../domain/uai");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { validateCfd } = require("../domain/cfd");
const { validateSiret } = require("../domain/siret");

module.exports = () => ({
  existsStatut,
  getStatut,
  addOrUpdateStatuts,
  getStatutHistory,
  updateStatut,
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
  periode_formation,
  annee_formation,
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
    periode_formation,
    annee_formation
  );
  const count = await StatutCandidat.countDocuments(query);
  return count !== 0;
};

const getStatut = ({
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
  periode_formation,
  annee_formation,
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
    periode_formation,
    annee_formation
  );
  return StatutCandidat.findOne(query);
};

const addOrUpdateStatuts = async (itemsToAddOrUpdate) => {
  const added = [];
  const updated = [];

  await asyncForEach(itemsToAddOrUpdate, async (item) => {
    const foundItem = await getStatut({
      ine_apprenant: item.ine_apprenant,
      nom_apprenant: item.nom_apprenant,
      prenom_apprenant: item.prenom_apprenant,
      prenom2_apprenant: item.prenom2_apprenant,
      prenom3_apprenant: item.prenom3_apprenant,
      email_contact: item.email_contact,
      id_formation: item.id_formation,
      uai_etablissement: item.uai_etablissement,
      periode_formation: item.periode_formation,
      annee_formation: item.annee_formation,
    });

    // create a new statutCandidat if no found statut or if found statut has an existing SIRET but different than item to add/update
    const shouldCreateStatutCandidat =
      !foundItem || (foundItem.siret_etablissement && item.siret_etablissement !== foundItem.siret_etablissement);

    if (shouldCreateStatutCandidat) {
      const addedItem = await createStatutCandidat(item);
      added.push(addedItem);
    } else {
      const updatedItem = await updateStatut(foundItem._id, item);
      updated.push(updatedItem);
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
  periode_formation,
  annee_formation,
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
    periode_formation,
    annee_formation
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

const createStatutCandidat = (itemToCreate) => {
  const toAdd = new StatutCandidat({
    ine_apprenant: itemToCreate.ine_apprenant,
    nom_apprenant: itemToCreate.nom_apprenant,
    prenom_apprenant: itemToCreate.prenom_apprenant,
    prenom2_apprenant: itemToCreate.prenom2_apprenant,
    prenom3_apprenant: itemToCreate.prenom3_apprenant,
    ne_pas_solliciter: itemToCreate.ne_pas_solliciter,
    email_contact: itemToCreate.email_contact,
    nom_representant_legal: itemToCreate.nom_representant_legal,
    tel_representant_legal: itemToCreate.tel_representant_legal,
    tel2_representant_legal: itemToCreate.tel2_representant_legal,
    id_formation: itemToCreate.id_formation,
    id_formation_valid: validateCfd(itemToCreate.id_formation),
    libelle_court_formation: itemToCreate.libelle_court_formation,
    libelle_long_formation: itemToCreate.libelle_long_formation,
    uai_etablissement: itemToCreate.uai_etablissement,
    uai_etablissement_valid: validateUai(itemToCreate.uai_etablissement),
    siret_etablissement: itemToCreate.siret_etablissement,
    siret_etablissement_valid: validateSiret(itemToCreate.siret_etablissement),
    nom_etablissement: itemToCreate.nom_etablissement,
    statut_apprenant: itemToCreate.statut_apprenant,
    historique_statut_apprenant: [
      {
        valeur_statut: itemToCreate.statut_apprenant,
        position_statut: 1,
        date_statut: new Date(),
      },
    ],
    date_entree_statut: itemToCreate.date_entree_statut,
    date_saisie_statut: itemToCreate.date_saisie_statut,
    date_mise_a_jour_statut: itemToCreate.date_mise_a_jour_statut,
    date_metier_mise_a_jour_statut: itemToCreate.date_metier_mise_a_jour_statut,
    periode_formation: itemToCreate.periode_formation,
    annee_formation: itemToCreate.annee_formation,
    source: itemToCreate.source,
  });
  return toAdd.save();
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
  periode_formation,
  annee_formation
) =>
  ine_apprenant
    ? {
        ine_apprenant: ine_apprenant,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
        periode_formation: periode_formation,
        annee_formation: annee_formation,
      }
    : {
        nom_apprenant: nom_apprenant,
        prenom_apprenant: prenom_apprenant,
        prenom2_apprenant: prenom2_apprenant,
        prenom3_apprenant: prenom3_apprenant,
        email_contact: email_contact,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
        periode_formation: periode_formation,
        annee_formation: annee_formation,
      };

const isMajStatutInvalid = (statutSource, statutDest) => {
  return codesMajStatutsInterdits.some((x) => x.source === statutSource && x.destination === statutDest);
};
