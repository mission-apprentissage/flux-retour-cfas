import { getDbCollection } from "../mongodb.js";
import usersModelDescriptor from "./previous.models/users.model.js";
import userEventsModelDescriptor from "./next.toKeep.models/userEvents.model.js";
import formationsModelDescriptor from "./next.toKeep.models/formations.model.js";
import jobEventsModelDescriptor from "./next.toKeep.models/jobEvents.model.js";
import dossiersApprenantsApiErrorsModelDescriptor from "./previous.models/dossiersApprenantsApiErrors.model.js";
import fiabilisationUaiSiretModelDescriptor from "./next.toKeep.models/fiabilisationUaiSiret.model.js";
import dossiersApprenantsModelDescriptor from "./dossiersApprenants.model.js";
import usersMigrationModelDescriptor from "./next.toKeep.models/usersMigration.model.js";
import JwtSessionsModelDescriptor from "./next.toKeep.models/jwtSessions.model.js";
import MaintenanceMessagesModelDescriptor from "./next.toKeep.models/maintenanceMessages.model.js";
import RolesModelDescriptor from "./next.toKeep.models/roles.model.js";
import PermissionsDescriptor from "./next.toKeep.models/permissions.model.js";
import OrganismesModelDescriptor from "./next.toKeep.models/organismes.model.js";
import dossiersApprenantsMigrationModelDescriptor from "./next.toKeep.models/dossiersApprenantsMigration.model.js";
import effectifsModelDescriptor from "./next.toKeep.models/effectifs.model/effectifs.model.js";
import uploadsModelDescriptor from "./next.toKeep.models/uploads.model/uploads.model.js";

export const modelDescriptors = [
  usersModelDescriptor,
  userEventsModelDescriptor,
  formationsModelDescriptor,
  dossiersApprenantsModelDescriptor,
  jobEventsModelDescriptor,
  dossiersApprenantsApiErrorsModelDescriptor,
  usersMigrationModelDescriptor,
  JwtSessionsModelDescriptor,
  MaintenanceMessagesModelDescriptor,
  RolesModelDescriptor,
  PermissionsDescriptor,
  OrganismesModelDescriptor,
  dossiersApprenantsMigrationModelDescriptor,
  effectifsModelDescriptor,
  uploadsModelDescriptor,
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

export function maintenanceMessageDb() {
  return getDbCollection(MaintenanceMessagesModelDescriptor.collectionName);
}

export function dossiersApprenantsMigrationDb() {
  return getDbCollection(dossiersApprenantsMigrationModelDescriptor.collectionName);
}

export function effectifsDb() {
  return getDbCollection(effectifsModelDescriptor.collectionName);
}

export function uploadsDb() {
  return getDbCollection(uploadsModelDescriptor.collectionName);
}

export const dossiersApprenantsApiErrorsDb = () => {
  return getDbCollection(dossiersApprenantsApiErrorsModelDescriptor.collectionName);
};

export const fiabilisationUaiSiretDb = () => {
  return getDbCollection(fiabilisationUaiSiretModelDescriptor.collectionName);
};
