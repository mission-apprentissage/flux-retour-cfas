import * as usersMigrationModelDescriptor from "./usersMigration.model.js";
import * as RolesModelDescriptor from "./roles.model.js";
import * as JwtSessionsModelDescriptor from "./jwtSessions.model.js";
import { getDbCollection } from "../mongodb.js";
import usersModelDescriptor from "./users.model.js";
import userEventsModelDescriptor from "./userEvents.model.js";
import cfasModelDescriptor from "./cfas.model.js";
import formationsModelDescriptor from "./formations.model.js";
import reseauxCfasModelDescriptor from "./reseauxCfas.model.js";
import dossiersApprenantsModelDescriptor from "./dossiersApprenants.model.js";
import jobEventsModelDescriptor from "./jobEvents.model.js";
import effectifsApprenantsModelDescriptor from "./effectifsApprenants.model.js";
import demandesIdentifiantsModelDescriptor from "./demandesIdentifiants.model.js";
import demandesBranchementErpDbModelDescriptor from "./demandesBranchementErp.model.js";
import duplicatesEventsModelDescriptor from "./duplicatesEvents.model.js";
import archiveDossiersApprenantsModelDescriptor from "./archiveDossiersApprenants.model.js";
import dossiersApprenantsApiErrorsModelDescriptor from "./dossiersApprenantsApiErrors.model.js";
import referentielSiretUaiModelDescriptor from "./referentielSiretUai.model.js";

import * as CerfasModelDescriptor from "./cerfa.model/cerfa.model.js";

export const modelDescriptors = [
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

export const dossiersApprenantsDb = () => {
  return getDbCollection(dossiersApprenantsModelDescriptor.collectionName);
};

export const cfasDb = () => {
  return getDbCollection(cfasModelDescriptor.collectionName);
};

export const reseauxCfasDb = () => {
  return getDbCollection(reseauxCfasModelDescriptor.collectionName);
};

export const formationsDb = () => {
  return getDbCollection(formationsModelDescriptor.collectionName);
};

export const usersDb = () => {
  return getDbCollection(usersModelDescriptor.collectionName);
};

export const userEventsDb = () => {
  return getDbCollection(userEventsModelDescriptor.collectionName);
};

export const jobEventsDb = () => {
  return getDbCollection(jobEventsModelDescriptor.collectionName);
};

export const effectifsApprenantsDb = () => {
  return getDbCollection(effectifsApprenantsModelDescriptor.collectionName);
};

export const demandesIdentifiantsDb = () => {
  return getDbCollection(demandesIdentifiantsModelDescriptor.collectionName);
};

export const demandesBranchementErpDb = () => {
  return getDbCollection(demandesBranchementErpDbModelDescriptor.collectionName);
};

export const duplicatesEventsDb = () => {
  return getDbCollection(duplicatesEventsModelDescriptor.collectionName);
};

export const usersMigrationDb = () => {
  return getDbCollection(usersMigrationModelDescriptor.collectionName);
};

export const rolesDb = () => {
  return getDbCollection(RolesModelDescriptor.collectionName);
};

export const jwtSessionsDb = () => {
  return getDbCollection(JwtSessionsModelDescriptor.collectionName);
};

export const archiveDossiersApprenantsDb = () => {
  return getDbCollection(archiveDossiersApprenantsModelDescriptor.collectionName);
};

export const dossiersApprenantsApiErrorsDb = () => {
  return getDbCollection(dossiersApprenantsApiErrorsModelDescriptor.collectionName);
};

export const referentielSiretUaiDb = () => {
  return getDbCollection(referentielSiretUaiModelDescriptor.collectionName);
};

export function CerfasDb() {
  return getDbCollection(CerfasModelDescriptor.collectionName);
}
