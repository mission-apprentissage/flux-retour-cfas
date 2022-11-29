import logger from "../../../common/logger.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { dossiersApprenantsMigrationDb } from "../../../common/model/collections.js";
import { findOrganismeById, updateOrganisme } from "../../../common/actions/organismes.actions.js";
import { getFormations } from "../../../common/apis/apiCatalogueMna.js";

/**
 * Script qui initialise les formations liées aux organismes
 */
export const hydrateOrganismesFormations = async () => {
  // Récupère tous les organismes distinct
  const allOrganismesId = await dossiersApprenantsMigrationDb().distinct("organisme_id").toArray();

  logger.info(allOrganismesId.length, "organismes id distincts dans les dossiersApprenants");

  await asyncForEach(allOrganismesId, async (currentOrganismeId) => {
    const organismeFound = await findOrganismeById(currentOrganismeId);
    const allFormationsForOrganisme = await dossiersApprenantsMigrationDb().distinct("organisme_id").toArray();

    if (organismeFound) {
      // TODO Update formations for organisme
      const formationsToAdd = await getFormationsListForOrganisme(organismeFound.uai);
      if (formationsToAdd.length > 0) {
        await updateOrganisme(currentOrganismeId, { organismeFound, ...{ formations: formationsToAdd } });
      }
    }
  });
};

/**
 *
 * @param {*} uai
 * @param {*} cfd
 * @returns
 */
const getFormationsListForOrganisme = async (uai) => {
  // TODO Hardcoded : call Catalogue API
  // const formationsListHardCoded = [
  //   {
  //     formationId: "test",
  //     organismes: [
  //       { id_organisme: "OFR1", nature: "responsable" },
  //       { id_organisme: "OFR2", nature: "formateur" },
  //     ],
  //   },
  // ];

  const formationsFromCatalog = await getFormations({ query: { etablissement_gestionnaire_uai: uai } });

  return formationsFromCatalog;
};
