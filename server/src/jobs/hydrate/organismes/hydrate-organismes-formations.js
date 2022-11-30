import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { getFormations } from "../../../common/apis/apiCatalogueMna.js";
import { findFormationById } from "../../../common/actions/formations.actions.js";
import { findOrganismeById, updateOrganisme } from "../../../common/actions/organismes.actions.js";

/**
 * Script qui initialise les formations liées aux organismes
 */
export const hydrateOrganismesFormations = async () => {
  // Récupère tous les organismes id distinct dans les dossiersApprenants
  const allOrganismesId = await dossiersApprenantsMigrationDb().distinct("organisme_id");

  logger.info(allOrganismesId.length, "organismes id distincts dans les dossiersApprenants");

  await asyncForEach(allOrganismesId, async (organisme_id) => {
    // Récupère toutes les formations id distinctes pour cet organisme dans les dossiersApprenants
    const formationsIdForOrganisme = await dossiersApprenantsMigrationDb().distinct("formation_id", {
      organisme_id,
    });

    if (formationsIdForOrganisme.length > 0) {
      // Construction d'une liste de formations
      let formationsForOrganismeArray = [];
      await asyncForEach(formationsIdForOrganisme, async (formation_id) => {
        const formation = await findFormationById(formation_id);

        // TODO Call Catalogue for CFD / UAI as gestionnaire & formateur
        // Ajout à la liste des formation de l'organisme d'un item contenant formation_id et liste des organismes liés à cette formation
        formationsForOrganismeArray.push({
          formation_id,
          organismes: await fetchOrganismesInfoForFormation(formation),
        });
      });

      // MAJ de l'organisme avec sa liste de formations
      // const organisme = await findOrganismeById(organisme_id);
      await updateOrganisme(organisme_id, { formations: formationsForOrganismeArray });
    }
  });
};

/**
 *
 * @param {*} uai
 * @param {*} cfd
 * @returns
 */
const fetchOrganismesInfoForFormation = async (formation) => {
  // TODO Call Catalogue API & Referentiel API for getting info
  // const formationsFromCatalog = await getFormations({ query: { cfd: formation.cfd } });

  return [
    { id_organisme: "OFR1", nature: "responsable" },
    { id_organisme: "OFR2", nature: "formateur" },
  ];
};

const buildOrganismesInfoList = async (formationsFromCatalog) => {};
