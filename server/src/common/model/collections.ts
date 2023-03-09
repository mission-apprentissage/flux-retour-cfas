import { getDbCollection } from "../mongodb";
import usersModelDescriptor from "./users.model";
import userEventsModelDescriptor from "./userEvents.model";
import formationsModelDescriptor from "./formations.model";
import jobEventsModelDescriptor from "./jobEvents.model";
import dossiersApprenantsApiErrorsModelDescriptor from "./dossiersApprenantsApiErrors.model";
import fiabilisationUaiSiretModelDescriptor from "./fiabilisationUaiSiret.model";
import usersMigrationModelDescriptor from "./usersMigration.model";
import JwtSessionsModelDescriptor from "./jwtSessions.model";
import MaintenanceMessagesModelDescriptor from "./maintenanceMessages.model";
import RolesModelDescriptor from "./roles.model";
import PermissionsDescriptor from "./permissions.model";
import OrganismesModelDescriptor from "./organismes.model";
import OrganismesReferentielModelDescriptor from "./organismesReferentiel.model";
import dossiersApprenantsMigrationModelDescriptor from "./dossiersApprenantsMigration.model";
import effectifsModelDescriptor from "./effectifs.model/effectifs.model";
import uploadsModelDescriptor from "./uploads.model/uploads.model";

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
  OrganismesReferentielModelDescriptor,
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

export function organismesReferentielDb() {
  return getDbCollection(OrganismesReferentielModelDescriptor.collectionName);
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
