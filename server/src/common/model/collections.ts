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
import OrganismesReferentielModelDescriptor from "./organismesReferentiel.model.js";
import dossiersApprenantsMigrationModelDescriptor from "./dossiersApprenantsMigration.model.js";
import effectifsModelDescriptor from "./effectifs.model/effectifs.model.js";
import uploadsModelDescriptor from "./uploads.model/uploads.model.js";
import {
  DossiersApprenantsMigration,
  Effectif,
  FiabilisationUaiSiret,
  Formation,
  JobEvent,
  JwtSession,
  MaintenanceMessage,
  Organisme,
  OrganismesReferentiel,
  Permission,
  Role,
  Upload,
  UserEvent,
  User,
  UsersMigration,
} from "./@types";

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

export const formationsDb = () => getDbCollection<Formation>(formationsModelDescriptor.collectionName);
export const usersDb = () => getDbCollection<User>(usersModelDescriptor.collectionName);
export const userEventsDb = () => getDbCollection<UserEvent>(userEventsModelDescriptor.collectionName);
export const jobEventsDb = () => getDbCollection<JobEvent>(jobEventsModelDescriptor.collectionName);
export const usersMigrationDb = () => getDbCollection<UsersMigration>(usersMigrationModelDescriptor.collectionName);
export const rolesDb = () => getDbCollection<Role>(RolesModelDescriptor.collectionName);
export const jwtSessionsDb = () => getDbCollection<JwtSession>(JwtSessionsModelDescriptor.collectionName);
export const organismesDb = () => getDbCollection<Organisme>(OrganismesModelDescriptor.collectionName);
export const dossiersApprenantsApiErrorsDb = () =>
  getDbCollection<any>(dossiersApprenantsApiErrorsModelDescriptor.collectionName);
export const organismesReferentielDb = () =>
  getDbCollection<OrganismesReferentiel>(OrganismesReferentielModelDescriptor.collectionName);
export const permissionsDb = () => getDbCollection<Permission>(PermissionsDescriptor.collectionName);
export const maintenanceMessageDb = () =>
  getDbCollection<MaintenanceMessage>(MaintenanceMessagesModelDescriptor.collectionName);
export const dossiersApprenantsMigrationDb = () =>
  getDbCollection<DossiersApprenantsMigration>(dossiersApprenantsMigrationModelDescriptor.collectionName);
export const effectifsDb = () => getDbCollection<Effectif>(effectifsModelDescriptor.collectionName);
export const uploadsDb = () => getDbCollection<Upload>(uploadsModelDescriptor.collectionName);
export const fiabilisationUaiSiretDb = () =>
  getDbCollection<FiabilisationUaiSiret>(fiabilisationUaiSiretModelDescriptor.collectionName);
