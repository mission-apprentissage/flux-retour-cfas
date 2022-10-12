const { runScript } = require("../scriptWrapper");
const { fetchOrganismes } = require("../../common/apis/apiReferentielMna");
const { asyncForEach } = require("../../common/utils/asyncUtils");

/**
 * Script qui crée l'url privée des CFA ayant un token
 */
runScript(async ({ db }) => {
  const dbCollection = db.collection("referentielSiret");

  await dbCollection.deleteMany();

  const { organismes } = await fetchOrganismes({
    champs: "siret,etat_administratif,uai",
    itemsPerPage: 10000,
  });

  await asyncForEach(organismes, async (organisme) => {
    await dbCollection.insertOne(organisme);
  });
}, "seed-organismes-from-referentiel");
