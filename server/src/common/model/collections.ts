import { getDbCollection } from "../mongodb.js";
import usersModelDescriptor from "./users.model.js";
import formationsModelDescriptor from "./formations.model.js";
import jobEventsModelDescriptor from "./jobEvents.model.js";
import fiabilisationUaiSiretModelDescriptor from "./fiabilisationUaiSiret.model.js";
import usersMigrationModelDescriptor from "./usersMigration.model.js";
import JwtSessionsModelDescriptor from "./jwtSessions.model.js";
import MaintenanceMessagesModelDescriptor from "./maintenanceMessages.model.js";
import OrganismesModelDescriptor from "./organismes.model.js";
import OrganismesReferentielModelDescriptor from "./organismesReferentiel.model.js";
import effectifsModelDescriptor from "./effectifs.model/effectifs.model.js";
import effectifsQueueModelDescriptor from "./effectifsQueue.model.js";
import uploadsModelDescriptor from "./uploads.model/uploads.model.js";
import {
  Effectif,
  FiabilisationUaiSiret,
  Formation,
  JobEvent,
  JwtSession,
  MaintenanceMessage,
  Organisme,
  OrganismesReferentiel,
  Upload,
  User,
  UsersMigration,
} from "./@types";
import { EffectifsQueue } from "./@types/EffectifsQueue.js";
import invitationsModelDescriptor, { Invitation } from "./invitations.model.js";
import organisationsModelDescriptor, { Organisation } from "./organisations.model.js";

export const modelDescriptors = [
  usersModelDescriptor,
  formationsModelDescriptor,
  jobEventsModelDescriptor,
  usersMigrationModelDescriptor,
  JwtSessionsModelDescriptor,
  MaintenanceMessagesModelDescriptor,
  invitationsModelDescriptor,
  organisationsModelDescriptor,
  OrganismesModelDescriptor,
  OrganismesReferentielModelDescriptor,
  effectifsModelDescriptor,
  effectifsQueueModelDescriptor,
  uploadsModelDescriptor,
  fiabilisationUaiSiretModelDescriptor,
];

export const formationsDb = () => getDbCollection<Formation>(formationsModelDescriptor.collectionName);
export const usersDb = () => getDbCollection<User>(usersModelDescriptor.collectionName);
export const jobEventsDb = () => getDbCollection<JobEvent>(jobEventsModelDescriptor.collectionName);
export const usersMigrationDb = () => getDbCollection<UsersMigration>(usersMigrationModelDescriptor.collectionName);
export const jwtSessionsDb = () => getDbCollection<JwtSession>(JwtSessionsModelDescriptor.collectionName);
export const organismesDb = () => getDbCollection<Organisme>(OrganismesModelDescriptor.collectionName);
export const invitationsDb = () => getDbCollection<Invitation>(invitationsModelDescriptor.collectionName);
export const organisationsDb = () => getDbCollection<Organisation>(organisationsModelDescriptor.collectionName);
export const organismesReferentielDb = () =>
  getDbCollection<OrganismesReferentiel>(OrganismesReferentielModelDescriptor.collectionName);
export const maintenanceMessageDb = () =>
  getDbCollection<MaintenanceMessage>(MaintenanceMessagesModelDescriptor.collectionName);
export const effectifsDb = () => getDbCollection<Effectif>(effectifsModelDescriptor.collectionName);
export const effectifsQueueDb = () => getDbCollection<EffectifsQueue>(effectifsQueueModelDescriptor.collectionName);
export const uploadsDb = () => getDbCollection<Upload>(uploadsModelDescriptor.collectionName);
export const fiabilisationUaiSiretDb = () =>
  getDbCollection<FiabilisationUaiSiret>(fiabilisationUaiSiretModelDescriptor.collectionName);
