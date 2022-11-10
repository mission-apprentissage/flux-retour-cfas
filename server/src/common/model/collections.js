const { getDbCollection } = require("../mongodb");
const usersModelDescriptor = require("./users.model");
const userEventsModelDescriptor = require("./userEvents.model");
const cfasModelDescriptor = require("./cfas.model");
const formationsModelDescriptor = require("./formations.model");
const reseauxCfasModelDescriptor = require("./reseauxCfas.model");
const dossiersApprenantsModelDescriptor = require("./dossiersApprenants.model");
const jobEventsModelDescriptor = require("./jobEvents.model");
const effectifsApprenantsModelDescriptor = require("./effectifsApprenants.model");
const demandesIdentifiantsModelDescriptor = require("./demandesIdentifiants.model");
const demandesBranchementErpDbModelDescriptor = require("./demandesBranchementErp.model");
const duplicatesEventsModelDescriptor = require("./duplicatesEvents.model");

const dossiersApprenantsDb = () => {
  return getDbCollection(dossiersApprenantsModelDescriptor.collectionName);
};

const cfasDb = () => {
  return getDbCollection(cfasModelDescriptor.collectionName);
};

const reseauxCfasDb = () => {
  return getDbCollection(reseauxCfasModelDescriptor.collectionName);
};

const formationsDb = () => {
  return getDbCollection(formationsModelDescriptor.collectionName);
};

const usersDb = () => {
  return getDbCollection(usersModelDescriptor.collectionName);
};

const userEventsDb = () => {
  return getDbCollection(userEventsModelDescriptor.collectionName);
};

const jobEventsDb = () => {
  return getDbCollection(jobEventsModelDescriptor.collectionName);
};

const effectifsApprenantsDb = () => {
  return getDbCollection(effectifsApprenantsModelDescriptor.collectionName);
};

const demandesIdentifiantsDb = () => {
  return getDbCollection(demandesIdentifiantsModelDescriptor.collectionName);
};

const demandesBranchementErpDb = () => {
  return getDbCollection(demandesBranchementErpDbModelDescriptor.collectionName);
};

const duplicatesEventsDb = () => {
  return getDbCollection(duplicatesEventsModelDescriptor.collectionName);
};

module.exports = {
  dossiersApprenantsDb,
  cfasDb,
  reseauxCfasDb,
  formationsDb,
  usersDb,
  userEventsDb,
  jobEventsDb,
  effectifsApprenantsDb,
  demandesIdentifiantsDb,
  demandesBranchementErpDb,
  duplicatesEventsDb,
};
