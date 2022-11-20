import { getDbCollection } from "../mongodb.js";
import usersModelDescriptor from "./previous.models/users.model.js";
import userEventsModelDescriptor from "./previous.models/userEvents.model.js";
import cfasModelDescriptor from "./previous.models/cfas.model.js";
import formationsModelDescriptor from "./previous.models/formations.model.js";
import reseauxCfasModelDescriptor from "./previous.models/reseauxCfas.model.js";
import dossiersApprenantsModelDescriptor from "./previous.models/dossiersApprenants.model.js";
import jobEventsModelDescriptor from "./previous.models/jobEvents.model.js";
import effectifsApprenantsModelDescriptor from "./previous.models/effectifsApprenants.model.js";
import demandesIdentifiantsModelDescriptor from "./previous.models/demandesIdentifiants.model.js";
import demandesBranchementErpDbModelDescriptor from "./previous.models/demandesBranchementErp.model.js";
import duplicatesEventsModelDescriptor from "./previous.models/duplicatesEvents.model.js";
import archiveDossiersApprenantsModelDescriptor from "./previous.models/archiveDossiersApprenants.model.js";
import dossiersApprenantsApiErrorsModelDescriptor from "./previous.models/dossiersApprenantsApiErrors.model.js";
import referentielSiretUaiModelDescriptor from "./previous.models/referentielSiretUai.model.js";

import * as usersMigrationModelDescriptor from "./new.models/usersMigration.model.js";
import * as RolesModelDescriptor from "./new.models/roles.model.js";
import * as JwtSessionsModelDescriptor from "./new.models/jwtSessions.model.js";
import * as sifasModelDescriptor from "./new.models/sifa.model/sifa.model.js";

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
  sifasModelDescriptor,
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

export function SifasDb() {
  return getDbCollection(sifasModelDescriptor.collectionName);
}
