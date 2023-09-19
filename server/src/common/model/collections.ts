import { getDbCollection } from "@/common/mongodb";

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
import { BassinsEmploi } from "./@types/BassinsEmploi";
import { ContratDeca } from "./@types/ContratDeca";
import { EffectifsQueue } from "./@types/EffectifsQueue";
import { FormationsCatalogue } from "./@types/FormationsCatalogue";
import { OrganismeSoltea } from "./@types/OrganismeSoltea";
import { Rncp } from "./@types/Rncp";
import bassinsEmploiDescriptor from "./bassinsEmploi.model";
import contratsDecaModelDescriptor from "./contratsDeca.model/contratsDeca.model";
import effectifsModelDescriptor from "./effectifs.model/effectifs.model";
import effectifsQueueModelDescriptor from "./effectifsQueue.model";
import fiabilisationUaiSiretModelDescriptor from "./fiabilisationUaiSiret.model";
import formationsModelDescriptor from "./formations.model";
import formationsCatalogueModelDescriptor from "./formationsCatalogue.model";
import invitationsModelDescriptor, { Invitation } from "./invitations.model";
import jobModelDescriptor, { IJob } from "./job.model";
import jobEventsModelDescriptor from "./jobEvents.model";
import JwtSessionsModelDescriptor from "./jwtSessions.model";
import MaintenanceMessagesModelDescriptor from "./maintenanceMessages.model";
import organisationsModelDescriptor, { Organisation } from "./organisations.model";
import OrganismesModelDescriptor from "./organismes.model";
import OrganismesReferentielModelDescriptor from "./organismesReferentiel.model";
import OrganismesSolteaModelDescriptor from "./organismesSoltea.model";
import rncpModelDescriptor from "./rncp.model";
import uploadsModelDescriptor from "./uploads.model/uploads.model";
import usersModelDescriptor from "./users.model";
import usersMigrationModelDescriptor from "./usersMigration.model";

export const modelDescriptors = [
  usersModelDescriptor,
  formationsModelDescriptor,
  formationsCatalogueModelDescriptor,
  jobEventsModelDescriptor,
  jobModelDescriptor,
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
  uploadsModelDescriptor,
  fiabilisationUaiSiretModelDescriptor,
  bassinsEmploiDescriptor,
  contratsDecaModelDescriptor,
  rncpModelDescriptor,
];

export const formationsDb = () => getDbCollection<Formation>(formationsModelDescriptor.collectionName);
export const formationsCatalogueDb = () =>
  getDbCollection<FormationsCatalogue>(formationsCatalogueModelDescriptor.collectionName);
export const usersDb = () => getDbCollection<User>(usersModelDescriptor.collectionName);
export const jobEventsDb = () => getDbCollection<JobEvent>(jobEventsModelDescriptor.collectionName);
export const jobsDb = () => getDbCollection<IJob>(jobModelDescriptor.collectionName);
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
export const bassinsEmploiDb = () => getDbCollection<BassinsEmploi>(bassinsEmploiDescriptor.collectionName);
export const organismesSolteaDb = () =>
  getDbCollection<OrganismeSoltea>(OrganismesSolteaModelDescriptor.collectionName);
export const rncpDb = () => getDbCollection<Rncp>(rncpModelDescriptor.collectionName);
export const contratsDecaDb = () => getDbCollection<ContratDeca>(contratsDecaModelDescriptor.collectionName);
