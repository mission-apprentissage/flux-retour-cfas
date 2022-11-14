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
const archiveDossiersApprenantsModelDescriptor = require("./archiveDossiersApprenants.model");
const dossiersApprenantsApiErrorsModelDescriptor = require("./dossiersApprenantsApiErrors.model");
const referentielSiretUaiModelDescriptor = require("./referentielSiretUai.model");

const modelDescriptors = [
  usersModelDescriptor,
  userEventsModelDescriptor,
  cfasModelDescriptor,
  formationsModelDescriptor,
  reseauxCfasModelDescriptor,
  dossiersApprenantsModelDescriptor,
  jobEventsModelDescriptor,
  effectifsApprenantsModelDescriptor,
  demandesIdentifiantsModelDescriptor,
  demandesBranchementErpDbModelDescriptor,
  duplicatesEventsModelDescriptor,
  archiveDossiersApprenantsModelDescriptor,
  dossiersApprenantsApiErrorsModelDescriptor,
  referentielSiretUaiModelDescriptor,
];

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

const archiveDossiersApprenantsDb = () => {
  return getDbCollection(archiveDossiersApprenantsModelDescriptor.collectionName);
};

const dossiersApprenantsApiErrorsDb = () => {
  return getDbCollection(dossiersApprenantsApiErrorsModelDescriptor.collectionName);
};

const referentielSiretUaiDb = () => {
  return getDbCollection(referentielSiretUaiModelDescriptor.collectionName);
};

module.exports = {
  modelDescriptors,
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
  archiveDossiersApprenantsDb,
  dossiersApprenantsApiErrorsDb,
  referentielSiretUaiDb,
};
