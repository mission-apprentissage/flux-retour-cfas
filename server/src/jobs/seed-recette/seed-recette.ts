import { subDays } from "date-fns";
import type { Collection, Document, OptionalUnlessRequiredId } from "mongodb";

import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import parentLogger from "@/common/logger";
import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import config from "@/config";

import { buildCatalogue } from "./catalogue";
import type { SeedDocs } from "./catalogue/types";
import { loadSeedContext } from "./factories";
import {
  cfaOrganisationIds,
  cfaOrganismeIds,
  CFA_HOST_CODES,
  HOSTS_RECETTE,
  ML_HOST_CODES,
  mlOrganisationIds,
  type SeedRecetteHosts,
} from "./hosts";
import { SEED_ID_RANGE } from "./seed-ids";

const logger = parentLogger.child({ module: "job:seed-recette" });

const ALLOWED_ENVS = ["recette", "local", "test"];

const ML_A_RDV_URL = "https://rdv.seed.recette.invalid/ml-a";

interface SeedRecetteOptions {
  dryRun?: boolean;
  uninstall?: boolean;
  hosts?: SeedRecetteHosts;
  env?: string;
  now?: Date;
}

export interface SeedRecettePurgeReport {
  effectifs: number;
  effectifsDECA: number;
  missionLocaleEffectif: number;
  missionLocaleEffectifLog: number;
  missionLocaleCfaInvitations: number;
  usersMigration: number;
}

export interface SeedRecetteFlagsReport {
  missionsLocales: number;
  organisationsCfa: number;
  organismes: number;
}

export interface SeedRecetteCreationReport {
  effectifs: number;
  effectifsDECA: number;
  missionLocaleEffectif: number;
  missionLocaleEffectifLog: number;
  usersMigration: number;
}

export interface SeedRecetteReport {
  dryRun: boolean;
  uninstall: boolean;
  utilisateursNonFictifs: number;
  purge: SeedRecettePurgeReport;
  flagsRetires: SeedRecetteFlagsReport | null;
  crees: SeedRecetteCreationReport | null;
}

export function assertSeedRecetteEnv(env: string) {
  if (!ALLOWED_ENVS.includes(env)) {
    throw new Error(`seed:recette refusé en environnement « ${env} » (autorisés : ${ALLOWED_ENVS.join(", ")})`);
  }
}

async function assertHostsExist(hosts: SeedRecetteHosts) {
  const manquants: string[] = [];

  for (const code of ML_HOST_CODES) {
    const found = await organisationsDb().countDocuments({ _id: hosts.missionsLocales[code], type: "MISSION_LOCALE" });
    if (!found) manquants.push(`${code} (organisation ${hosts.missionsLocales[code]})`);
  }

  for (const code of CFA_HOST_CODES) {
    const { organisationId, organismeId } = hosts.cfas[code];
    const organisation = await organisationsDb().countDocuments({
      _id: organisationId,
      type: "ORGANISME_FORMATION",
      organisme_id: organismeId.toString(),
    });
    const organisme = await organismesDb().countDocuments({ _id: organismeId });
    if (!organisation || !organisme)
      manquants.push(`${code} (organisation ${organisationId}, organisme ${organismeId})`);
  }

  if (manquants.length > 0) {
    throw new Error(`Hôtes introuvables : ${manquants.join(" ; ")}`);
  }
}

async function assertHostsSansActivite(hosts: SeedRecetteHosts) {
  const organismeIds = cfaOrganismeIds(hosts);
  const horsSeed = { $not: SEED_ID_RANGE };

  const [effectifs, effectifsDECA, dossiersMl] = await Promise.all([
    effectifsDb().countDocuments({ organisme_id: { $in: organismeIds }, _id: horsSeed }),
    effectifsDECADb().countDocuments({ organisme_id: { $in: organismeIds }, _id: horsSeed }),
    missionLocaleEffectifsDb().countDocuments({
      mission_locale_id: { $in: mlOrganisationIds(hosts) },
      effectif_id: horsSeed,
    }),
  ]);

  if (effectifs + effectifsDECA + dossiersMl > 0) {
    throw new Error(
      `Hôtes avec une activité réelle, seed annulé : ${effectifs} effectifs ERP, ${effectifsDECA} effectifs DECA, ${dossiersMl} dossiers ML hors seed`
    );
  }
}

async function countUtilisateursNonFictifs(hosts: SeedRecetteHosts) {
  return usersMigrationDb().countDocuments({
    organisation_id: { $in: [...mlOrganisationIds(hosts), ...cfaOrganisationIds(hosts)] },
    _id: { $not: SEED_ID_RANGE },
  });
}

async function purgeSeed(hosts: SeedRecetteHosts, dryRun: boolean): Promise<SeedRecettePurgeReport> {
  const dossiersMlFilter = { $or: [{ _id: SEED_ID_RANGE }, { effectif_id: SEED_ID_RANGE }] };
  const dossierMlIds = (
    await missionLocaleEffectifsDb()
      .find(dossiersMlFilter, { projection: { _id: 1 } })
      .toArray()
  ).map((d) => d._id);

  const filters = {
    effectifs: { _id: SEED_ID_RANGE },
    effectifsDECA: { _id: SEED_ID_RANGE },
    missionLocaleEffectifLog: { $or: [{ _id: SEED_ID_RANGE }, { mission_locale_effectif_id: { $in: dossierMlIds } }] },
    missionLocaleCfaInvitations: {
      $or: [{ _id: SEED_ID_RANGE }, { mission_locale_id: { $in: mlOrganisationIds(hosts) } }],
    },
    usersMigration: { _id: SEED_ID_RANGE },
  };

  if (dryRun) {
    const [effectifs, effectifsDECA, missionLocaleEffectifLog, missionLocaleCfaInvitations, usersMigration] =
      await Promise.all([
        effectifsDb().countDocuments(filters.effectifs),
        effectifsDECADb().countDocuments(filters.effectifsDECA),
        missionLocaleEffectifsLogDb().countDocuments(filters.missionLocaleEffectifLog),
        missionLocaleCfaInvitationsDb().countDocuments(filters.missionLocaleCfaInvitations),
        usersMigrationDb().countDocuments(filters.usersMigration),
      ]);
    return {
      effectifs,
      effectifsDECA,
      missionLocaleEffectif: dossierMlIds.length,
      missionLocaleEffectifLog,
      missionLocaleCfaInvitations,
      usersMigration,
    };
  }

  const logs = await missionLocaleEffectifsLogDb().deleteMany(filters.missionLocaleEffectifLog);
  const dossiersMl = await missionLocaleEffectifsDb().deleteMany({ _id: { $in: dossierMlIds } });
  const [effectifs, effectifsDECA, invitations, users] = await Promise.all([
    effectifsDb().deleteMany(filters.effectifs),
    effectifsDECADb().deleteMany(filters.effectifsDECA),
    missionLocaleCfaInvitationsDb().deleteMany(filters.missionLocaleCfaInvitations),
    usersMigrationDb().deleteMany(filters.usersMigration),
  ]);

  return {
    effectifs: effectifs.deletedCount,
    effectifsDECA: effectifsDECA.deletedCount,
    missionLocaleEffectif: dossiersMl.deletedCount,
    missionLocaleEffectifLog: logs.deletedCount,
    missionLocaleCfaInvitations: invitations.deletedCount,
    usersMigration: users.deletedCount,
  };
}

async function unsetHostFlags(hosts: SeedRecetteHosts, dryRun: boolean): Promise<SeedRecetteFlagsReport> {
  const mlFilter = {
    _id: { $in: mlOrganisationIds(hosts) },
    $or: [{ activated_at: { $exists: true } }, { rdv_url: { $exists: true } }],
  };
  const cfaOrganisationFilter = { _id: { $in: cfaOrganisationIds(hosts) }, ml_beta_activated_at: { $exists: true } };
  const organismeFilter = {
    _id: { $in: cfaOrganismeIds(hosts) },
    $or: [
      { is_allowed_collab: { $exists: true } },
      { is_allowed_deca: { $exists: true } },
      { collab_inactivity_email_sent_at: { $exists: true } },
      { collab_suspended_at: { $exists: true } },
      { collab_resumed_at: { $exists: true } },
    ],
  };

  if (dryRun) {
    const [missionsLocales, organisationsCfa, organismes] = await Promise.all([
      organisationsDb().countDocuments(mlFilter),
      organisationsDb().countDocuments(cfaOrganisationFilter),
      organismesDb().countDocuments(organismeFilter),
    ]);
    return { missionsLocales, organisationsCfa, organismes };
  }

  const [missionsLocales, organisationsCfa, organismes] = await Promise.all([
    organisationsDb().updateMany(mlFilter, { $unset: { activated_at: "", rdv_url: "" } }),
    organisationsDb().updateMany(cfaOrganisationFilter, { $unset: { ml_beta_activated_at: "" } }),
    organismesDb().updateMany(organismeFilter, {
      $unset: {
        is_allowed_collab: "",
        is_allowed_deca: "",
        collab_inactivity_email_sent_at: "",
        collab_suspended_at: "",
        collab_resumed_at: "",
      },
    }),
  ]);

  return {
    missionsLocales: missionsLocales.modifiedCount,
    organisationsCfa: organisationsCfa.modifiedCount,
    organismes: organismes.modifiedCount,
  };
}

async function setMlHostFlags(hosts: SeedRecetteHosts, now: Date) {
  await organisationsDb().updateOne(
    { _id: hosts.missionsLocales.ML_A },
    { $set: { activated_at: subDays(now, 180), rdv_url: ML_A_RDV_URL } }
  );
  await organisationsDb().updateOne({ _id: hosts.missionsLocales.ML_B }, { $unset: { activated_at: "", rdv_url: "" } });
}

async function insertDocs(docs: SeedDocs) {
  const insert = async <T extends Document>(collection: Collection<T>, items: OptionalUnlessRequiredId<T>[]) => {
    if (items.length > 0) await collection.insertMany(items);
  };
  await insert(effectifsDb(), docs.effectifs);
  await insert(effectifsDECADb(), docs.effectifsDeca);
  await insert(missionLocaleEffectifsDb(), docs.dossiers);
  await insert(missionLocaleEffectifsLogDb(), docs.logs);
  await insert(usersMigrationDb(), docs.users);
}

async function createSeed(hosts: SeedRecetteHosts, now: Date, dryRun: boolean): Promise<SeedRecetteCreationReport> {
  if (!dryRun) {
    await setMlHostFlags(hosts, now);
  }
  const ctx = await loadSeedContext(hosts, now);
  const docs = await buildCatalogue(ctx);
  if (!dryRun) {
    await insertDocs(docs);
    for (const mlId of mlOrganisationIds(hosts)) {
      await createOrUpdateMissionLocaleStats(mlId);
    }
  }
  return {
    effectifs: docs.effectifs.length,
    effectifsDECA: docs.effectifsDeca.length,
    missionLocaleEffectif: docs.dossiers.length,
    missionLocaleEffectifLog: docs.logs.length,
    usersMigration: docs.users.length,
  };
}

export async function seedRecette({
  dryRun = false,
  uninstall = false,
  hosts = HOSTS_RECETTE,
  env = config.env,
  now = new Date(),
}: SeedRecetteOptions = {}): Promise<SeedRecetteReport> {
  assertSeedRecetteEnv(env);
  await assertHostsExist(hosts);
  if (!uninstall) {
    await assertHostsSansActivite(hosts);
  }

  const utilisateursNonFictifs = await countUtilisateursNonFictifs(hosts);
  if (utilisateursNonFictifs > 0) {
    logger.warn({ utilisateursNonFictifs }, "Des utilisateurs hors seed sont rattachés aux organisations hôtes");
  }

  const purge = await purgeSeed(hosts, dryRun);
  const flagsRetires = uninstall ? await unsetHostFlags(hosts, dryRun) : null;
  const crees = uninstall ? null : await createSeed(hosts, now, dryRun);

  const report: SeedRecetteReport = { dryRun, uninstall, utilisateursNonFictifs, purge, flagsRetires, crees };
  logger.info(report, dryRun ? "Seed recette simulé (dry-run)" : "Seed recette terminé");
  return report;
}
