import auditLogsModelDescriptor, { IAuditLog } from "shared/models/data/auditLogs.model";
import brevoContactListModelDescriptor, { IBrevoContactList } from "shared/models/data/brevoContactList.model";
import brevoSyncSettingsModelDescriptor, { IBrevoSyncSettings } from "shared/models/data/brevoSyncSettings.model";
import communesVoiesModelDescriptor, { ICommunesVoies } from "shared/models/data/communesVoies.model";
import connexionInvitationsModelDescriptor, {
  IConnexionInvitation,
} from "shared/models/data/connexionInvitations.model";
import demandesActivationCfaModelDescriptor, {
  IDemandeActivationCfa,
} from "shared/models/data/demandesActivationCfa.model";
import effectifsModelDescriptor, { IEffectif } from "shared/models/data/effectifs.model";
import effectifsArchiveModelDescriptor, { IEffectifArchive } from "shared/models/data/effectifsArchive.model";
import effectifsDECAModelDescriptor, { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import effectifsPurgesStatsModelDescriptor, {
  IEffectifsPurgesStats,
} from "shared/models/data/effectifsPurgesStats.model";
import effectifsQueueModelDescriptor, { IEffectifQueue } from "shared/models/data/effectifsQueue.model";
import erpModelDescriptor, { IErp } from "shared/models/data/erp.model";
import formationsCatalogueModelDescriptor, { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import franceTravailEffectifDescriptor, {
  IFranceTravailEffectif,
} from "shared/models/data/franceTravailEffectif.model";
import invitationsModelDescriptor, { IInvitation } from "shared/models/data/invitations.model";
import invitationsArchiveModelDescriptor, { IInvitationArchive } from "shared/models/data/invitationsArchive.model";
import JwtSessionsModelDescriptor, { IJwtSession } from "shared/models/data/jwtSessions.model";
import missionLocaleCfaInvitationsDescriptor, {
  IMissionLocaleCfaInvitation,
} from "shared/models/data/missionLocaleCfaInvitations.model";
import missionLocaleEffectifDescriptor, {
  IMissionLocaleEffectif,
} from "shared/models/data/missionLocaleEffectif.model";
import missionLocaleEffectifLogDescriptor, {
  IMissionLocaleEffectifLog,
} from "shared/models/data/missionLocaleEffectifLog.model";
import missionLocaleEffectifsPurgesStatsDescriptor, {
  IMissionLocaleEffectifsPurgesStats,
} from "shared/models/data/missionLocaleEffectifsPurgesStats.model";
import missionLocaleStatsDescriptor, { IMissionLocaleStats } from "shared/models/data/missionLocaleStats.model";
import missionLocaleStatsPurgesDescriptor, {
  IMissionLocaleStatsPurges,
} from "shared/models/data/missionLocaleStatsPurges.model";
import opcosDescriptor, { IOpcos } from "shared/models/data/opco/opcos.model";
import opcosRncpDescriptor, { IOpcoRncp } from "shared/models/data/opco/opcosRncp.model";
import organisationsModelDescriptor, { IOrganisation } from "shared/models/data/organisations.model";
import OrganismesModelDescriptor, { IOrganisme } from "shared/models/data/organismes.model";
import regionsModelDescriptor, { IRegion } from "shared/models/data/regions.model";
import ReseauxModelDescriptor, { IReseau } from "shared/models/data/reseaux.model";
import rncpModelDescriptor, { IRncp } from "shared/models/data/rncp.model";
import romeSecteurActivitesDescriptor, { IRomeSecteurActivites } from "shared/models/data/romeSecteurActivites.model";
import sipaUsersModelDescriptor, { ISipaUser } from "shared/models/data/sipaUsers.model";
import telechargementListesNominativesLogsDescriptor, {
  ITelechargementListeNomLogs,
} from "shared/models/data/telechargementListesNomLogs.model";
import transmissionDailyReportDescriptor, {
  ITransmissionDailyReport,
} from "shared/models/data/transmissionDailyReport.model";
import usersMigrationModelDescriptor, { IUsersMigration } from "shared/models/data/usersMigration.model";
import formationV2ModelDescriptor, { IFormationV2 } from "shared/models/data/v2/formation.v2.model";
import voeuxAffelnetDescriptor, { IVoeuAffelnet } from "shared/models/data/voeuxAffelnet.model";

import { getDbCollection } from "@/common/mongodb";

export const modelDescriptors = [
  auditLogsModelDescriptor,
  formationsCatalogueModelDescriptor,
  usersMigrationModelDescriptor,
  JwtSessionsModelDescriptor,
  invitationsModelDescriptor,
  invitationsArchiveModelDescriptor,
  demandesActivationCfaModelDescriptor,
  organisationsModelDescriptor,
  OrganismesModelDescriptor,
  effectifsModelDescriptor,
  effectifsQueueModelDescriptor,
  rncpModelDescriptor,
  effectifsDECAModelDescriptor,
  effectifsArchiveModelDescriptor,
  effectifsPurgesStatsModelDescriptor,
  voeuxAffelnetDescriptor,
  telechargementListesNominativesLogsDescriptor,
  opcosDescriptor,
  opcosRncpDescriptor,
  formationV2ModelDescriptor,
  ReseauxModelDescriptor,
  missionLocaleEffectifDescriptor,
  missionLocaleCfaInvitationsDescriptor,
  regionsModelDescriptor,
  missionLocaleEffectifLogDescriptor,
  brevoContactListModelDescriptor,
  brevoSyncSettingsModelDescriptor,
  connexionInvitationsModelDescriptor,
  transmissionDailyReportDescriptor,
  missionLocaleStatsDescriptor,
  missionLocaleStatsPurgesDescriptor,
  missionLocaleEffectifsPurgesStatsDescriptor,
  franceTravailEffectifDescriptor,
  romeSecteurActivitesDescriptor,
  sipaUsersModelDescriptor,
  communesVoiesModelDescriptor,
];

export const formationsCatalogueDb = () =>
  getDbCollection<IFormationCatalogue>(formationsCatalogueModelDescriptor.collectionName);
export const usersMigrationDb = () => getDbCollection<IUsersMigration>(usersMigrationModelDescriptor.collectionName);
export const jwtSessionsDb = () => getDbCollection<IJwtSession>(JwtSessionsModelDescriptor.collectionName);
export const sipaUsersDb = () => getDbCollection<ISipaUser>(sipaUsersModelDescriptor.collectionName);
export const organismesDb = () => getDbCollection<IOrganisme>(OrganismesModelDescriptor.collectionName);
export const invitationsDb = () => getDbCollection<IInvitation>(invitationsModelDescriptor.collectionName);
export const demandesActivationCfaDb = () =>
  getDbCollection<IDemandeActivationCfa>(demandesActivationCfaModelDescriptor.collectionName);
export const invitationsArchiveDb = () =>
  getDbCollection<IInvitationArchive>(invitationsArchiveModelDescriptor.collectionName);
export const organisationsDb = () => getDbCollection<IOrganisation>(organisationsModelDescriptor.collectionName);
export const effectifsDb = () => getDbCollection<IEffectif>(effectifsModelDescriptor.collectionName);
export const effectifsArchiveDb = () =>
  getDbCollection<IEffectifArchive>(effectifsArchiveModelDescriptor.collectionName);
export const effectifsDECADb = () => getDbCollection<IEffectifDECA>(effectifsDECAModelDescriptor.collectionName);
export const effectifsQueueDb = () => getDbCollection<IEffectifQueue>(effectifsQueueModelDescriptor.collectionName);
export const effectifsPurgesStatsDb = () =>
  getDbCollection<IEffectifsPurgesStats>(effectifsPurgesStatsModelDescriptor.collectionName);
export const communesVoiesDb = () => getDbCollection<ICommunesVoies>(communesVoiesModelDescriptor.collectionName);
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
export const missionLocaleCfaInvitationsDb = () =>
  getDbCollection<IMissionLocaleCfaInvitation>(missionLocaleCfaInvitationsDescriptor.collectionName);
export const missionLocaleStatsDb = () =>
  getDbCollection<IMissionLocaleStats>(missionLocaleStatsDescriptor.collectionName);

export const missionLocaleStatsPurgesDb = () =>
  getDbCollection<IMissionLocaleStatsPurges>(missionLocaleStatsPurgesDescriptor.collectionName);

export const missionLocaleEffectifsPurgesStatsDb = () =>
  getDbCollection<IMissionLocaleEffectifsPurgesStats>(missionLocaleEffectifsPurgesStatsDescriptor.collectionName);
export const missionLocaleEffectifsLogDb = () =>
  getDbCollection<IMissionLocaleEffectifLog>(missionLocaleEffectifLogDescriptor.collectionName);
export const regionsDb = () => getDbCollection<IRegion>(regionsModelDescriptor.collectionName);
export const brevoContactListDb = () =>
  getDbCollection<IBrevoContactList>(brevoContactListModelDescriptor.collectionName);
export const brevoSyncSettingsDb = () =>
  getDbCollection<IBrevoSyncSettings>(brevoSyncSettingsModelDescriptor.collectionName);
export const connexionInvitationsDb = () =>
  getDbCollection<IConnexionInvitation>(connexionInvitationsModelDescriptor.collectionName);
export const transmissionDailyReportDb = () =>
  getDbCollection<ITransmissionDailyReport>(transmissionDailyReportDescriptor.collectionName);

export const franceTravailEffectifsDb = () =>
  getDbCollection<IFranceTravailEffectif>(franceTravailEffectifDescriptor.collectionName);
export const romeSecteurActivitesDb = () =>
  getDbCollection<IRomeSecteurActivites>(romeSecteurActivitesDescriptor.collectionName);

// v2

export const formationV2Db = () => getDbCollection<IFormationV2>(formationV2ModelDescriptor.collectionName);
