const logger = require("../../../common/logger");
const config = require("config");
const { StatutCandidat } = require("../../../common/model");
const { apiStatutsSeeder, administrator } = require("../../../common/roles");
const { asyncForEach } = require("../../../common/utils/asyncUtils");
const { fullSample } = require("../../../../tests/data/sample");

const seedUsers = async (users) => {
  logger.info(`Creating user ${config.users.defaultAdmin.name}`);
  await users.createUser(config.users.defaultAdmin.name, config.users.defaultAdmin.password, {
    permissions: [administrator],
  });

  logger.info(`Creating user ${config.users.ymag}`);
  await users.createUser(config.users.ymag, config.apiKeys.ymag, {
    permissions: [apiStatutsSeeder],
    apiKey: config.apiKeys.ymag,
  });
};

const seedSample = async (statutsCandidats) => {
  await asyncForEach(fullSample, async (statut) => {
    const toAdd = new StatutCandidat(statut);
    const exist = await statutsCandidats.existsStatut({
      ine_apprenant: toAdd.ine_apprenant,
      nom_apprenant: toAdd.nom_apprenant,
      prenom_apprenant: toAdd.prenom_apprenant,
      prenom2_apprenant: toAdd.prenom2_apprenant,
      prenom3_apprenant: toAdd.prenom3_apprenant,
      email_contact: toAdd.email_contact,
      id_formation: toAdd.id_formation,
      uai_etablissement: toAdd.uai_etablissement,
    });
    if (!exist) {
      await toAdd.save();
    }
  });
};

module.exports = {
  seedUsers,
  seedSample,
};
