const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { CfaModel } = require("../../common/model");
const { getOrganismesWithUai } = require("../../common/apis/apiReferentielMna");
const { sleep } = require("../../common/utils/miscUtils");
const { logger } = require("env-var");

// the Referentiel API allows 400 requests per minute
const SLEEP_TIME_BETWEEN_REFERENTIEL_API_REQUESTS = 150;

/**
 * Ce script tente de récupérer pour chaque UAI présent dans la collection Cfa la nature de l'organisme de formation
 */
runScript(async ({ cfas, cache }) => {
  // Gets all cfa
  const allCfa = await CfaModel.find().lean();

  const getOrganismesWithUaiCached = getOrganismesWithUai(cache);

  await asyncForEach(allCfa, async (cfa) => {
    await sleep(SLEEP_TIME_BETWEEN_REFERENTIEL_API_REQUESTS);
    try {
      const { pagination, organismes } = await getOrganismesWithUaiCached(cfa.uai);
      // skip if no result or more than one found in Referentiel
      const foundResults = pagination.total > 0;
      const moreThanOneResult = pagination.total > 1;
      if (!foundResults || moreThanOneResult) return;

      const organismeFromReferentiel = organismes[0];
      // if cfa in db has only SIRET and it matches the one found in referentiel then it's a perfect match
      const perfectUaiSiretMatch = cfa.sirets.length === 1 && cfa.sirets[0] === organismeFromReferentiel.siret;

      await cfas.updateCfaNature(cfa.uai, {
        nature: organismeFromReferentiel.nature,
        natureValidityWarning: !perfectUaiSiretMatch,
      });
    } catch (err) {
      logger.error(err);
    }
  });
}, "retrieve-nature-organisme-de-formation-in-referentiel-uai-siret");
