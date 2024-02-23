import {
  Effectif,
  FiabilisationUaiSiret,
  Formation,
  Organisme,
  OrganismesReferentiel,
} from "shared/models/data/@types";
import { EffectifsQueue } from "shared/models/data/@types/EffectifsQueue";
import auditLogsModelDescriptor, { IAuditLog } from "shared/models/data/auditLogs.model";
import bassinsEmploiDescriptor, { IBassinEmploi } from "shared/models/data/bassinsEmploi.model";
import contratsDecaModelDescriptor, { IContratDeca } from "shared/models/data/contratsDeca.model";
import effectifsModelDescriptor from "shared/models/data/effectifs.model";
import effectifsQueueModelDescriptor from "shared/models/data/effectifsQueue.model";
import fiabilisationUaiSiretModelDescriptor from "shared/models/data/fiabilisationUaiSiret.model";
import formationsModelDescriptor from "shared/models/data/formations.model";
import formationsCatalogueModelDescriptor, { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import invitationsModelDescriptor, { IInvitation } from "shared/models/data/invitations.model";
import jobEventsModelDescriptor from "shared/models/data/jobEvents.model";
import JwtSessionsModelDescriptor, { IJwtSession } from "shared/models/data/jwtSessions.model";
import MaintenanceMessagesModelDescriptor, { IMaintenanceMessage } from "shared/models/data/maintenanceMessages.model";
import organisationsModelDescriptor, { Organisation } from "shared/models/data/organisations.model";
import OrganismesModelDescriptor from "shared/models/data/organismes.model";
import OrganismesReferentielModelDescriptor from "shared/models/data/organismesReferentiel.model";
import OrganismesSolteaModelDescriptor, { IOrganismeSoltea } from "shared/models/data/organismesSoltea.model";
import rncpModelDescriptor, { IRncp } from "shared/models/data/rncp.model";
import romeModelDescriptor, { IRome } from "shared/models/data/rome.model";
import usersModelDescriptor, { IUser } from "shared/models/data/users.model";
import usersMigrationModelDescriptor, { IUsersMigration } from "shared/models/data/usersMigration.model";

import { getDbCollection } from "@/common/mongodb";

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
  getDbCollection<IFormationCatalogue>(formationsCatalogueModelDescriptor.collectionName);
export const usersDb = () => getDbCollection<IUser>(usersModelDescriptor.collectionName);
export const usersMigrationDb = () => getDbCollection<IUsersMigration>(usersMigrationModelDescriptor.collectionName);
export const jwtSessionsDb = () => getDbCollection<IJwtSession>(JwtSessionsModelDescriptor.collectionName);
export const organismesDb = () => getDbCollection<Organisme>(OrganismesModelDescriptor.collectionName);
export const invitationsDb = () => getDbCollection<IInvitation>(invitationsModelDescriptor.collectionName);
export const organisationsDb = () => getDbCollection<Organisation>(organisationsModelDescriptor.collectionName);
export const organismesReferentielDb = () =>
  getDbCollection<OrganismesReferentiel>(OrganismesReferentielModelDescriptor.collectionName);
export const maintenanceMessageDb = () =>
  getDbCollection<IMaintenanceMessage>(MaintenanceMessagesModelDescriptor.collectionName);
export const effectifsDb = () => getDbCollection<Effectif>(effectifsModelDescriptor.collectionName);
export const effectifsQueueDb = () => getDbCollection<EffectifsQueue>(effectifsQueueModelDescriptor.collectionName);
export const fiabilisationUaiSiretDb = () =>
  getDbCollection<FiabilisationUaiSiret>(fiabilisationUaiSiretModelDescriptor.collectionName);
export const bassinsEmploiDb = () => getDbCollection<IBassinEmploi>(bassinsEmploiDescriptor.collectionName);
export const organismesSolteaDb = () =>
  getDbCollection<IOrganismeSoltea>(OrganismesSolteaModelDescriptor.collectionName);
export const romeDb = () => getDbCollection<IRome>(romeModelDescriptor.collectionName);
export const rncpDb = () => getDbCollection<IRncp>(rncpModelDescriptor.collectionName);
export const contratsDecaDb = () => getDbCollection<IContratDeca>(contratsDecaModelDescriptor.collectionName);
export const auditLogsDb = () => getDbCollection<IAuditLog>(auditLogsModelDescriptor.collectionName);
