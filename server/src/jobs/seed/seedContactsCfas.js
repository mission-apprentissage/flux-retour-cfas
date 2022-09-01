const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { CfaModel, ContactCfaModel } = require("../../common/model");
const { fetchOrganismesContactsFromSirets } = require("../../common/apis/apiReferentielMna");
const { validateSiret } = require("../../common/domain/siret");
const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Script qui initialise la collection contactsCfas en appelant l'API du Référentiel
 */
runScript(async ({ contactsCfas }) => {
  logger.info("Clear Contacts CFAs collection...");
  await ContactCfaModel.deleteMany({});
  logger.info("Seeding Contacts CFAs from referentiel API");
  await seedContactsCfas(contactsCfas);
  logger.info("End seeding Contacts CFAs");
}, "seed contacts cfas");

/**
 * Fonction de seed de la collection contactsCfas
 */
const seedContactsCfas = async (contactsCfas) => {
  // Gets all cfa with siret in collection
  const allDistinctSiretsFromCfa = await CfaModel.find({ sirets: { $exists: true, $ne: [] } })
    .distinct("sirets")
    .lean();

  // Filter on valid siret only
  const validSirets = allDistinctSiretsFromCfa.filter((item) => !validateSiret(item).error);
  const siretJoinedList = validSirets.join(",");

  // Call referentiel api
  const { organismes } = await fetchOrganismesContactsFromSirets(siretJoinedList, validSirets.length);

  loadingBar.start(organismes.length, 0);

  await asyncForEach(organismes, async (currentOrganismeFromReferentiel) => {
    loadingBar.increment();

    // Si une liste de contact est remontée par l'API on parse ces contacts pour les ajouter
    await asyncForEach(currentOrganismeFromReferentiel?.contacts, async (currentContactToAdd) => {
      await contactsCfas.create({
        uai: currentOrganismeFromReferentiel?.uai ?? null,
        siret: currentOrganismeFromReferentiel?.siret,
        email_contact: currentContactToAdd.email,
        email_contact_confirme: currentContactToAdd.confirmé,
        sources: currentContactToAdd.sources,
      });
    });
  });

  loadingBar.stop();

  // Display stats
  const nbCfasInCfaCollection = await CfaModel.countDocuments();
  const nbCfasWithValidSiretsInCfaCollection = validSirets.length;
  const nbCfasFoundWithSiretInReferentiel = organismes.length;

  logger.info(`${nbCfasInCfaCollection} CFA dans la collection Cfa du Tdb`);
  logger.info(`${nbCfasWithValidSiretsInCfaCollection} CFA avec sirets valides dans la collection Cfa du Tdb`);
  logger.info(`${nbCfasFoundWithSiretInReferentiel} CFA trouvés à partir de leur siret dans l'API du référentiel`);
};
