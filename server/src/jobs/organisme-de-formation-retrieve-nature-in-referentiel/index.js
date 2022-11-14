const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const logger = require("../../common/logger");
const { cfasDb, referentielSiretUaiDb } = require("../../common/model/collections");

/**
 * Ce script tente de récupérer pour chaque UAI présent dans la collection Cfa la nature de l'organisme de formation
 */
runScript(async ({ cfas }) => {
  // Gets all cfa
  const allCfa = await cfasDb().find().toArray();

  let organismesNatureFound = 0;

  await asyncForEach(allCfa, async (cfa) => {
    try {
      const result = await referentielSiretUaiDb().find({ uai: cfa.uai }).toArray();
      // skip if no result or more than one found in Referentiel
      const uniqueResult = result.length === 1;

      if (uniqueResult) {
        const organismeFromReferentiel = result[0];
        // if cfa in db has only SIRET and it matches the one found in referentiel then it's a perfect match
        const perfectUaiSiretMatch = cfa.sirets.length === 1 && cfa.sirets[0] === organismeFromReferentiel.siret;
        organismesNatureFound++;

        await cfas.updateCfaNature(cfa.uai, {
          nature: organismeFromReferentiel.nature,
          natureValidityWarning: !perfectUaiSiretMatch,
        });
      }
    } catch (err) {
      logger.error(err);
    }
  });
  logger.info(organismesNatureFound, "organismes modifiés avec nature trouvée dans référentiel");
}, "retrieve-nature-organisme-de-formation-in-referentiel-uai-siret");
