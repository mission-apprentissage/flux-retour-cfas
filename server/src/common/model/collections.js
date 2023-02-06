import { getDbCollection } from "../mongodb.js";
import usersModelDescriptor from "./users.model.js";
import userEventsModelDescriptor from "./userEvents.model.js";
import formationsModelDescriptor from "./formations.model.js";
import jobEventsModelDescriptor from "./jobEvents.model.js";
import dossiersApprenantsApiErrorsModelDescriptor from "./dossiersApprenantsApiErrors.model.js";
import fiabilisationUaiSiretModelDescriptor from "./fiabilisationUaiSiret.model.js";
import usersMigrationModelDescriptor from "./usersMigration.model.js";
import JwtSessionsModelDescriptor from "./jwtSessions.model.js";
import MaintenanceMessagesModelDescriptor from "./maintenanceMessages.model.js";
import RolesModelDescriptor from "./roles.model.js";
import PermissionsDescriptor from "./permissions.model.js";
import OrganismesModelDescriptor from "./organismes.model.js";
import dossiersApprenantsMigrationModelDescriptor from "./dossiersApprenantsMigration.model.js";
import effectifsModelDescriptor from "./effectifs.model/effectifs.model.js";
import uploadsModelDescriptor from "./uploads.model/uploads.model.js";

export const modelDescriptors = [
  usersModelDescriptor,
  userEventsModelDescriptor,
  formationsModelDescriptor,
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
