import { Rncp } from "shared";
import {
  Effectif,
  FiabilisationUaiSiret,
  Formation,
  JobEvent,
  JwtSession,
  MaintenanceMessage,
  Organisme,
  OrganismesReferentiel,
  User,
  UsersMigration,
} from "shared/models/data/@types";
import { BassinsEmploi } from "shared/models/data/@types/BassinsEmploi";
import { ContratDeca } from "shared/models/data/@types/ContratDeca";
import { EffectifsQueue } from "shared/models/data/@types/EffectifsQueue";
import { FormationsCatalogue } from "shared/models/data/@types/FormationsCatalogue";
import { OrganismeSoltea } from "shared/models/data/@types/OrganismeSoltea";
import effectifsModelDescriptor from "shared/models/data/effectifs.model";
import formationsModelDescriptor from "shared/models/data/formations.model";

import { getDbCollection } from "@/common/mongodb";

import auditLogsModelDescriptor, { IAuditLog } from "./auditLogs.model";
import bassinsEmploiDescriptor from "./bassinsEmploi.model";
import contratsDecaModelDescriptor from "./contratsDeca.model/contratsDeca.model";
import effectifsQueueModelDescriptor from "./effectifsQueue.model";
import fiabilisationUaiSiretModelDescriptor from "./fiabilisationUaiSiret.model";
import formationsCatalogueModelDescriptor from "./formationsCatalogue.model";
import invitationsModelDescriptor, { Invitation } from "./invitations.model";
import jobEventsModelDescriptor from "./jobEvents.model";
import JwtSessionsModelDescriptor from "./jwtSessions.model";
import MaintenanceMessagesModelDescriptor from "./maintenanceMessages.model";
import organisationsModelDescriptor, { Organisation } from "./organisations.model";
import OrganismesModelDescriptor from "./organismes.model";
import OrganismesReferentielModelDescriptor from "./organismesReferentiel.model";
import OrganismesSolteaModelDescriptor from "./organismesSoltea.model";
import rncpModelDescriptor from "./rncp.model";
import romeModelDescriptor, { IRome } from "./rome.model";
import usersModelDescriptor from "./users.model";
import usersMigrationModelDescriptor from "./usersMigration.model";

export const modelDescriptors = [
  auditLogsModelDescriptor,
  usersModelDescriptor,
  formationsModelDescriptor,
  formationsCatalogueModelDescriptor,
  jobEventsModelDescriptor,
  usersMigrationModelDescriptor,
  JwtSessionsModelDescriptor,
  MaintenanceMessagesModelDescriptor,
  invitationsModelDescriptor,
  organisationsModelDescriptor,
  OrganismesModelDescriptor,
  OrganismesReferentielModelDescriptor,
  OrganismesSolteaModelDescriptor,
  effectifsModelDescriptor,
  effectifsQueueModelDescriptor,
  fiabilisationUaiSiretModelDescriptor,
  bassinsEmploiDescriptor,
  contratsDecaModelDescriptor,
  romeModelDescriptor,
  rncpModelDescriptor,
];

export const formationsDb = () => getDbCollection<Formation>(formationsModelDescriptor.collectionName);
export const formationsCatalogueDb = () =>
  getDbCollection<FormationsCatalogue>(formationsCatalogueModelDescriptor.collectionName);
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
export const fiabilisationUaiSiretDb = () =>
  getDbCollection<FiabilisationUaiSiret>(fiabilisationUaiSiretModelDescriptor.collectionName);
export const bassinsEmploiDb = () => getDbCollection<BassinsEmploi>(bassinsEmploiDescriptor.collectionName);
export const organismesSolteaDb = () =>
  getDbCollection<OrganismeSoltea>(OrganismesSolteaModelDescriptor.collectionName);
export const romeDb = () => getDbCollection<IRome>(romeModelDescriptor.collectionName);
export const rncpDb = () => getDbCollection<Rncp>(rncpModelDescriptor.collectionName);
export const contratsDecaDb = () => getDbCollection<ContratDeca>(contratsDecaModelDescriptor.collectionName);
export const auditLogsDb = () => getDbCollection<IAuditLog>(auditLogsModelDescriptor.collectionName);
