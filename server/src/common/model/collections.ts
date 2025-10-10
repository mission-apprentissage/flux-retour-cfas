import auditLogsModelDescriptor, { IAuditLog } from "shared/models/data/auditLogs.model";
import brevoMissionLocaleListModelDescriptor, {
  IBrevoMissionLocaleList,
} from "shared/models/data/brevoMissionLocaleList.model";
import brevoMissionLocaleTemplateModelDescriptor, {
  IBrevoMissionLocaleTemplate,
} from "shared/models/data/brevoMissionLocaleTemplate.model";
import effectifsModelDescriptor, { IEffectif } from "shared/models/data/effectifs.model";
import effectifsArchiveModelDescriptor, { IEffectifArchive } from "shared/models/data/effectifsArchive.model";
import effectifsDECAModelDescriptor, { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import effectifsQueueModelDescriptor, { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import erpModelDescriptor, { IErp } from "shared/models/data/erp.model";
import formationsCatalogueModelDescriptor, { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import invitationsModelDescriptor, { IInvitation } from "shared/models/data/invitations.model";
import invitationsArchiveModelDescriptor, { IInvitationArchive } from "shared/models/data/invitationsArchive.model";
import JwtSessionsModelDescriptor, { IJwtSession } from "shared/models/data/jwtSessions.model";
import MaintenanceMessagesModelDescriptor, { IMaintenanceMessage } from "shared/models/data/maintenanceMessages.model";
import missionLocaleEffectifDescriptor, {
  IMissionLocaleEffectif,
} from "shared/models/data/missionLocaleEffectif.model";
import missionLocaleEffectif2Descriptor, {
  IMissionLocale2Effectif,
} from "shared/models/data/missionLocaleEffectif2.model";
import missionLocaleEffectifLogDescriptor, {
  IMissionLocaleEffectifLog,
} from "shared/models/data/missionLocaleEffectifLog.model";
import missionLocaleStatsDescriptor, { IMissionLocaleStats } from "shared/models/data/missionLocaleStats.model";
import opcosDescriptor, { IOpcos } from "shared/models/data/opco/opcos.model";
import opcosRncpDescriptor, { IOpcoRncp } from "shared/models/data/opco/opcosRncp.model";
import organisationsModelDescriptor, { IOrganisation } from "shared/models/data/organisations.model";
import OrganismesModelDescriptor, { IOrganisme } from "shared/models/data/organismes.model";
import regionsModelDescriptor, { IRegion } from "shared/models/data/regions.model";
import ReseauxModelDescriptor, { IReseau } from "shared/models/data/reseaux.model";
import rncpModelDescriptor, { IRncp } from "shared/models/data/rncp.model";
import telechargementListesNominativesLogsDescriptor, {
  ITelechargementListeNomLogs,
} from "shared/models/data/telechargementListesNomLogs.model";
import transmissionDailyReportDescriptor, {
  ITransmissionDailyReport,
} from "shared/models/data/transmissionDailyReport.model";
import usersMigrationModelDescriptor, { IUsersMigration } from "shared/models/data/usersMigration.model";
import effectifsV2ModelDescriptor, { IEffectifV2 } from "shared/models/data/v2/effectif.v2.model";
import formationV2ModelDescriptor, { IFormationV2 } from "shared/models/data/v2/formation.v2.model";
import organismesV2ModelDescriptor, { IOrganismeV2 } from "shared/models/data/v2/organisme.v2.model";
import personV2ModelDescriptor, { IPersonV2 } from "shared/models/data/v2/person.v2.model";
import transmissionV2Descriptor, { ITransmissionV2 } from "shared/models/data/v2/transmission.v2.model";
import voeuxAffelnetDescriptor, { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";

import { getDbCollection } from "@/common/mongodb";

export const modelDescriptors = [
  auditLogsModelDescriptor,
  formationsCatalogueModelDescriptor,
  usersMigrationModelDescriptor,
  JwtSessionsModelDescriptor,
  MaintenanceMessagesModelDescriptor,
  invitationsModelDescriptor,
  invitationsArchiveModelDescriptor,
  organisationsModelDescriptor,
  OrganismesModelDescriptor,
  effectifsModelDescriptor,
  effectifsQueueModelDescriptor,
  rncpModelDescriptor,
  effectifsDECAModelDescriptor,
  effectifsArchiveModelDescriptor,
  voeuxAffelnetDescriptor,
  telechargementListesNominativesLogsDescriptor,
  opcosDescriptor,
  opcosRncpDescriptor,
  effectifsV2ModelDescriptor,
  formationV2ModelDescriptor,
  organismesV2ModelDescriptor,
  personV2ModelDescriptor,
  transmissionV2Descriptor,
  ReseauxModelDescriptor,
  missionLocaleEffectifDescriptor,
  missionLocaleEffectif2Descriptor,
  regionsModelDescriptor,
  brevoMissionLocaleTemplateModelDescriptor,
  missionLocaleEffectifLogDescriptor,
  brevoMissionLocaleListModelDescriptor,
  transmissionDailyReportDescriptor,
  missionLocaleStatsDescriptor,
];

export const formationsCatalogueDb = () =>
  getDbCollection<IFormationCatalogue>(formationsCatalogueModelDescriptor.collectionName);
export const usersMigrationDb = () => getDbCollection<IUsersMigration>(usersMigrationModelDescriptor.collectionName);
export const jwtSessionsDb = () => getDbCollection<IJwtSession>(JwtSessionsModelDescriptor.collectionName);
export const organismesDb = () => getDbCollection<IOrganisme>(OrganismesModelDescriptor.collectionName);
export const invitationsDb = () => getDbCollection<IInvitation>(invitationsModelDescriptor.collectionName);
export const invitationsArchiveDb = () =>
  getDbCollection<IInvitationArchive>(invitationsArchiveModelDescriptor.collectionName);
export const organisationsDb = () => getDbCollection<IOrganisation>(organisationsModelDescriptor.collectionName);
export const maintenanceMessageDb = () =>
  getDbCollection<IMaintenanceMessage>(MaintenanceMessagesModelDescriptor.collectionName);
export const effectifsDb = () => getDbCollection<IEffectif>(effectifsModelDescriptor.collectionName);
export const effectifsArchiveDb = () =>
  getDbCollection<IEffectifArchive>(effectifsArchiveModelDescriptor.collectionName);
export const effectifsDECADb = () => getDbCollection<IEffectifDECA>(effectifsDECAModelDescriptor.collectionName);
export const effectifsQueueDb = () => getDbCollection<IEffectifQueue>(effectifsQueueModelDescriptor.collectionName);
export const rncpDb = () => getDbCollection<IRncp>(rncpModelDescriptor.collectionName);
export const auditLogsDb = () => getDbCollection<IAuditLog>(auditLogsModelDescriptor.collectionName);
export const voeuxAffelnetDb = () => getDbCollection<IVoeuAffelnet>(voeuxAffelnetDescriptor.collectionName);
export const telechargementListesNominativesLogsDb = () =>
  getDbCollection<ITelechargementListeNomLogs>(telechargementListesNominativesLogsDescriptor.collectionName);
export const erpDb = () => getDbCollection<IErp>(erpModelDescriptor.collectionName);
export const opcosDb = () => getDbCollection<IOpcos>(opcosDescriptor.collectionName);
export const opcosRncpDb = () => getDbCollection<IOpcoRncp>(opcosRncpDescriptor.collectionName);
export const reseauxDb = () => getDbCollection<IReseau>(ReseauxModelDescriptor.collectionName);

export const missionLocaleEffectifsDb = () =>
  getDbCollection<IMissionLocaleEffectif>(missionLocaleEffectifDescriptor.collectionName);

export const missionLocaleEffectifs2Db = () =>
  getDbCollection<IMissionLocale2Effectif>(missionLocaleEffectif2Descriptor.collectionName);
export const missionLocaleStatsDb = () =>
  getDbCollection<IMissionLocaleStats>(missionLocaleStatsDescriptor.collectionName);
export const missionLocaleEffectifsLogDb = () =>
  getDbCollection<IMissionLocaleEffectifLog>(missionLocaleEffectifLogDescriptor.collectionName);
export const regionsDb = () => getDbCollection<IRegion>(regionsModelDescriptor.collectionName);
export const brevoMissionLocaleTemplateDb = () =>
  getDbCollection<IBrevoMissionLocaleTemplate>(brevoMissionLocaleTemplateModelDescriptor.collectionName);
export const brevoMissionLocaleListDb = () =>
  getDbCollection<IBrevoMissionLocaleList>(brevoMissionLocaleListModelDescriptor.collectionName);
export const transmissionDailyReportDb = () =>
  getDbCollection<ITransmissionDailyReport>(transmissionDailyReportDescriptor.collectionName);

// v2

export const organismeV2Db = () => getDbCollection<IOrganismeV2>(organismesV2ModelDescriptor.collectionName);
export const personV2Db = () => getDbCollection<IPersonV2>(personV2ModelDescriptor.collectionName);
export const formationV2Db = () => getDbCollection<IFormationV2>(formationV2ModelDescriptor.collectionName);
export const effectifV2Db = () => getDbCollection<IEffectifV2>(effectifsV2ModelDescriptor.collectionName);
export const transmissionV2Db = () => getDbCollection<ITransmissionV2>(transmissionV2Descriptor.collectionName);
