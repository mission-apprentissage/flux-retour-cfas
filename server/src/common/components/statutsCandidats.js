const { StatutCandidat } = require("../model");
const { codesMajStatutsInterdits, codesStatutsMajStatutCandidats } = require("../model/constants");
const { asyncForEach } = require("../../common/utils/asyncUtils");

module.exports = async () => {
  return {
    existsStatut,
    existsWithStatutValue: async ({
      ine_apprenant = null,
      nom_apprenant = null,
      prenom_apprenant = null,
      prenom2_apprenant = null,
      prenom3_apprenant = null,
      email_contact = null,
      id_formation,
      uai_etablissement,
      statut_apprenant,
    }) => {
      const query = getFindStatutWithValueQuery(
        ine_apprenant,
        nom_apprenant,
        prenom_apprenant,
        prenom2_apprenant,
        prenom3_apprenant,
        email_contact,
        id_formation,
        uai_etablissement,
        statut_apprenant
      );
      const count = await StatutCandidat.countDocuments(query);
      return count !== 0;
    },
    getStatut,
    addOrUpdateStatuts: async (itemsToAddOrUpdate) => {
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
        });
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
            nom_etablissement: item.nom_etablissement,
            statut_apprenant: item.statut_apprenant,
            date_entree_statut: item.date_entree_statut,
            date_saisie_statut: item.date_saisie_statut,
            date_mise_a_jour_statut: item.date_mise_a_jour_statut,
          });
          const addedItem = await toAdd.save();
          added.push(addedItem);
        }
      });

      return {
        added,
        updated,
      };
    },
    updateStatut,
  };
};

const existsStatut = async ({
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
}) => {
  const query = getFindStatutQuery(
    ine_apprenant,
    nom_apprenant,
    prenom_apprenant,
    prenom2_apprenant,
    prenom3_apprenant,
    email_contact,
    id_formation,
    uai_etablissement
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
}) => {
  const query = getFindStatutQuery(
    ine_apprenant,
    nom_apprenant,
    prenom_apprenant,
    prenom2_apprenant,
    prenom3_apprenant,
    email_contact,
    id_formation,
    uai_etablissement
  );
  const found = await StatutCandidat.findOne(query);
  return found;
};

const updateStatut = async (existingItemId, toUpdate) => {
  if (!existingItemId) return null;

  const existingItem = await StatutCandidat.findById(existingItemId);

  // Calcul date update
  if (existingItem.statut_apprenant !== toUpdate.statut_apprenant) {
    toUpdate.date_mise_a_jour_statut = Date.now();
  }

  // Check if maj statut is valid
  if (isMajStatutInvalid(existingItem.statut_apprenant, toUpdate.statut_apprenant)) {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ko;
    toUpdate.erreur_mise_a_jour_statut = {
      date_mise_a_jour_statut: Date.now(),
      ancien_statut: existingItem.statut_apprenant,
      nouveau_statut_souhaite: toUpdate.statut_apprenant,
    };
  } else {
    toUpdate.statut_mise_a_jour_statut = codesStatutsMajStatutCandidats.ok;
  }

  // Update & return
  toUpdate.updated_at = Date.now();
  return await StatutCandidat.findByIdAndUpdate(existingItemId, toUpdate);
};

const getFindStatutWithValueQuery = (
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement,
  statut_apprenant
) =>
  ine_apprenant
    ? {
        ine_apprenant: ine_apprenant,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
        statut_apprenant: statut_apprenant,
      }
    : {
        nom_apprenant: nom_apprenant,
        prenom_apprenant: prenom_apprenant,
        prenom2_apprenant: prenom2_apprenant,
        prenom3_apprenant: prenom3_apprenant,
        email_contact: email_contact,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
        statut_apprenant: statut_apprenant,
      };

const getFindStatutQuery = (
  ine_apprenant = null,
  nom_apprenant = null,
  prenom_apprenant = null,
  prenom2_apprenant = null,
  prenom3_apprenant = null,
  email_contact = null,
  id_formation,
  uai_etablissement
) =>
  ine_apprenant
    ? {
        ine_apprenant: ine_apprenant,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
      }
    : {
        nom_apprenant: nom_apprenant,
        prenom_apprenant: prenom_apprenant,
        prenom2_apprenant: prenom2_apprenant,
        prenom3_apprenant: prenom3_apprenant,
        email_contact: email_contact,
        id_formation: id_formation,
        uai_etablissement: uai_etablissement,
      };

const isMajStatutInvalid = (statutSource, statutDest) => {
  return codesMajStatutsInterdits.some((x) => x.source === statutSource && x.destination === statutDest);
};
