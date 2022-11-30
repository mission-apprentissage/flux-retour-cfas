import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { getFormationsForOrganismeFormation } from "../../../common/apis/apiCatalogueMna.js";
import { findFormationById } from "../../../common/actions/formations.actions.js";
import { findOrganismeById, findOrganismeByUai, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../../common/utils/validationsUtils/organisme-de-formation/nature.js";

/**
 * Script qui initialise les formations liées aux organismes
 * Va récupérer toutes les formations liés aux organismes via des dossiersApprenants présents en base
 * Sur chaque formation trouvée on va récupérer les infos de cette formation lié à cet organisme via le catalogue
 * et on en déduit la liste des organismes (avec leur nature) liés à cette formation pour cet organisme parent
 */
export const hydrateOrganismesFormations = async () => {
  // Récupère tous les organismes id distinct dans les dossiersApprenants
  const allOrganismesId = await dossiersApprenantsMigrationDb().distinct("organisme_id");

  logger.info(allOrganismesId.length, "organismes id distincts dans les dossiersApprenants");

  await asyncForEach(allOrganismesId, async (organisme_id) => {
    // Récupération de l'uai de l'organisme
    const organisme = await findOrganismeById(organisme_id);

    // Récupère toutes les formations id distinctes pour cet organisme dans les dossiersApprenants
    const formationsIdForOrganisme = await dossiersApprenantsMigrationDb().distinct("formation_id", {
      organisme_id,
    });

    if (formationsIdForOrganisme.length > 0) {
      // Construction d'une liste de formations pour cet organisme
      let formationsForOrganismeArray = [];
      await asyncForEach(formationsIdForOrganisme, async (formation_id) => {
        // Récupération du cfd de la formation
        const { cfd } = await findFormationById(formation_id);

        // Ajout à la liste des formation de l'organisme d'un item contenant formation_id
        // ainsi que la liste des organismes trouvés dans l'API Catalogue pour cet organisme (uai) et cette formation
        formationsForOrganismeArray.push({
          formation_id,
          organismes: await fetchOrganismesInfoForFormation(organisme, cfd),
        });
      });

      // MAJ de l'organisme avec sa liste de formations
      await updateOrganisme(organisme_id, { formations: formationsForOrganismeArray });
    }
  });
};

/**
 * Méthode de récupération des organismes liés à une formation d'un organisme
 * @param {*} organisme
 * @param {*} cfd
 * @returns
 */
const fetchOrganismesInfoForFormation = async (organisme, cfd) => {
  let organismesInfo = [];

  // Récupération des formations liés au cfd et à l'organisme
  const formationsForOrganismeAndCfd = await getFormationsForOrganismeFormation(organisme.uai, cfd);

  // Construction de la liste des organismes pour les formations rattachés à l'uai
  await asyncForEach(formationsForOrganismeAndCfd, async (currentFormation) => {
    // Recuperer l'uai responsable (gestionnaire)
    if (currentFormation.etablissement_gestionnaire_uai) {
      const organismeResponsable = await findOrganismeByUai(currentFormation.etablissement_gestionnaire_uai);
      if (organismeResponsable) {
        organismesInfo.push({
          organisme_id: organismeResponsable?._id,
          nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE,
          uai: currentFormation.etablissement_gestionnaire_uai, // TODO Get uai lieu de formation ?

          // TODO Get adresse from réferentiel ?
        });
      } else {
        // TODO Doit-on créer l'organisme si on ne le trouve pas dans les organismes du tdb ?
        organismesInfo.push({
          nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE,
          uai: currentFormation.etablissement_gestionnaire_uai, // TODO Get uai lieu de formation ?
          // TODO Get adresse from réferentiel ?
        });
      }
    }

    if (currentFormation.etablissement_formateur_uai) {
      const organismeResponsable = await findOrganismeByUai(currentFormation.etablissement_formateur_uai);
      if (organismeResponsable) {
        organismesInfo.push({
          organisme_id: organismeResponsable._id,
          nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
          uai: currentFormation.etablissement_formateur_uai, // TODO Get uai lieu de formation ?
          // TODO Get adresse from réferentiel ?
        });
      } else {
        // TODO Doit-on créer l'organisme si on ne le trouve pas dans les organismes du tdb ?
        organismesInfo.push({
          nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
          uai: currentFormation.etablissement_formateur_uai, // TODO Get uai lieu de formation ?
          // TODO Get uai lieu de formation ?
          // TODO Get adresse from réferentiel ?
        });
      }
    }

    // TODO Comment récupérer les organismes responsable_formateur / LIEU
  });

  let uniqOrganismes = [...new Set(organismesInfo.map(JSON.stringify))].map(JSON.parse);
  return uniqOrganismes;
};
