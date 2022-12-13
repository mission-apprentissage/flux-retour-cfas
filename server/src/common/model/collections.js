import { getDbCollection } from "../mongodb.js";
import usersModelDescriptor from "./previous.models/users.model.js";
import userEventsModelDescriptor from "./next.toKeep.models/userEvents.model.js";
import cfasModelDescriptor from "./previous.models/toRemove.models/cfas.model.js";
import formationsModelDescriptor from "./next.toKeep.models/formations.model.js";
import dossiersApprenantsModelDescriptor from "./previous.models/toRemove.models/dossiersApprenants.model.js";
import jobEventsModelDescriptor from "./next.toKeep.models/jobEvents.model.js";
import effectifsApprenantsModelDescriptor from "./previous.models/effectifsApprenants.model.js";
import duplicatesEventsModelDescriptor from "./previous.models/toRemove.models/duplicatesEvents.model.js";
import archiveDossiersApprenantsModelDescriptor from "./previous.models/toRemove.models/archiveDossiersApprenants.model.js";
import dossiersApprenantsApiErrorsModelDescriptor from "./previous.models/dossiersApprenantsApiErrors.model.js";
import referentielSiretUaiModelDescriptor from "./previous.models/toRemove.models/referentielSiretUai.model.js";

import * as usersMigrationModelDescriptor from "./next.toKeep.models/usersMigration.model.js";
import * as JwtSessionsModelDescriptor from "./next.toKeep.models/jwtSessions.model.js";
import * as RolesModelDescriptor from "./next.toKeep.models/roles.model.js";
import * as PermissionsDescriptor from "./next.toKeep.models/permissions.model.js";
import * as OrganismesModelDescriptor from "./next.toKeep.models/organismes.model.js";
import * as dossiersApprenantsMigrationModelDescriptor from "./next.toKeep.models/dossiersApprenantsMigration.model.js";
import * as effectifsModelDescriptor from "./next.toKeep.models/effectifs.model/effectifs.model.js";

export const modelDescriptors = [
  usersModelDescriptor,
  userEventsModelDescriptor,
  cfasModelDescriptor,
  formationsModelDescriptor,
  dossiersApprenantsModelDescriptor,
  jobEventsModelDescriptor,
  effectifsApprenantsModelDescriptor,
  duplicatesEventsModelDescriptor,
  archiveDossiersApprenantsModelDescriptor,
  dossiersApprenantsApiErrorsModelDescriptor,
  referentielSiretUaiModelDescriptor,

  usersMigrationModelDescriptor,
  JwtSessionsModelDescriptor,
  RolesModelDescriptor,
  PermissionsDescriptor,
  OrganismesModelDescriptor,
  dossiersApprenantsMigrationModelDescriptor,
  effectifsModelDescriptor,
  fiabilisationUaiSiretModelDescriptor,
];

export const dossiersApprenantsDb = () => {
  return getDbCollection(dossiersApprenantsModelDescriptor.collectionName);
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

export const usersMigrationDb = () => {
  return getDbCollection(usersMigrationModelDescriptor.collectionName);
};

export const rolesDb = () => {
  return getDbCollection(RolesModelDescriptor.collectionName);
};

export const jwtSessionsDb = () => {
  return getDbCollection(JwtSessionsModelDescriptor.collectionName);
};

export function organismesDb() {
  return getDbCollection(OrganismesModelDescriptor.collectionName);
}

export function permissionsDb() {
  return getDbCollection(PermissionsDescriptor.collectionName);
}

export function dossiersApprenantsMigrationDb() {
  return getDbCollection(dossiersApprenantsMigrationModelDescriptor.collectionName);
}

export function effectifsDb() {
  return getDbCollection(effectifsModelDescriptor.collectionName);
}

// TODO Collections descriptors à supprimer
export const cfasDb = () => {
  return getDbCollection(cfasModelDescriptor.collectionName);
};

export const referentielSiretUaiDb = () => {
  return getDbCollection(referentielSiretUaiModelDescriptor.collectionName);
};

export const duplicatesEventsDb = () => {
  return getDbCollection(duplicatesEventsModelDescriptor.collectionName);
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

export const fiabilisationUaiSiretDb = () => {
  return getDbCollection(fiabilisationUaiSiretModelDescriptor.collectionName);
};
