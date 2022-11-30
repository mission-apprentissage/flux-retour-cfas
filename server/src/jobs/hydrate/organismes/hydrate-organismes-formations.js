import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { getFormations } from "../../../common/apis/apiCatalogueMna.js";
import { findFormationById } from "../../../common/actions/formations.actions.js";
import { findOrganismeById, updateOrganisme } from "../../../common/actions/organismes.actions.js";

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
    const { uai } = await findOrganismeById(organisme_id);

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
          organismes: await fetchOrganismesInfoForFormation(uai, cfd),
        });
      });

      // MAJ de l'organisme avec sa liste de formations
      await updateOrganisme(organisme_id, { formations: formationsForOrganismeArray });
    }
  });
};

/**
 * Méthode de récupération des organismes liés à une formation d'un organisme
 * @param {*} uai
 * @param {*} cfd
 * @returns
 */
const fetchOrganismesInfoForFormation = async (uai, cfd) => {
  // TODO Call Catalogue API & Referentiel API for getting info
  // const formationsFromCatalog = await getFormations({ query: { cfd: formation.cfd } });

  return [
    { id_organisme: "OFR1", nature: "responsable" },
    { id_organisme: "OFR2", nature: "formateur" },
  ];
};

const buildOrganismesInfoList = async (formationsFromCatalog) => {};
