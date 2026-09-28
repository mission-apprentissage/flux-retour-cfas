import { captureException } from "@sentry/node";
import type { ICommune } from "api-alternance-sdk";
import { MongoBulkWriteError, type AnyBulkWriteOperation, type Collection, type Filter, type ObjectId } from "mongodb";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisationMissionLocale } from "shared/models/data/organisations.model";
import { getAnneesScolaireListFromDate } from "shared/utils";

import { estDossierMlTraite } from "@/common/actions/mission-locale/dossier-traite.actions";
import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { isDecaSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import parentLogger from "@/common/logger";
import {
  communesVoiesDb,
  effectifsDb,
  effectifsDECADb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  organisationsDb,
} from "@/common/model/collections";
import { normaliserVoie } from "@/common/services/commune/normaliserVoie";
import { resoudreCodeInsee, type ResolutionCodeInsee } from "@/common/services/commune/resoudreCodeInsee";

const logger = parentLogger.child({ module: "job:migrate:commune-apprenant" });

const BATCH_SIZE = 1_000;
const MAX_ECHECS_API = 3;
const MAX_ECARTS = 50;

type AdresseApprenant = {
  code_postal?: string | null;
  code_insee?: string | null;
  complete?: string | null;
  numero?: number | string | null;
  voie?: string | null;
  mission_locale_id?: number | null;
};

type EffectifAdresse = { _id: ObjectId; apprenant: { adresse?: AdresseApprenant | null } };

type CommunesApi = (codePostal: string) => Promise<ICommune[] | null>;

export type ChangementMissionLocale = {
  effectif_id: ObjectId;
  code_postal: string;
  ancien_ml_id: number | null;
  nouveau_ml_id: number | null;
};

type Methode = ResolutionCodeInsee["methode"];

type EcartResolution = {
  code_postal: string;
  voie: string;
  attendu: string;
  obtenu: string;
  methode: Methode;
};

type RapportCollection = {
  examines: number;
  insee_erp: number;
  precision: Record<Methode, { ok: number; ko: number }>;
  ecarts: EcartResolution[];
  devines: number;
  inchanges: number;
  modifies: number;
  hors_api: number;
  erreurs_api: number;
  methodes: Record<Methode, number>;
  changements_ml: number;
  snapshots_ml: number;
  batches_en_erreur: number;
};

type RapportReaffectation = {
  examines: number;
  candidats: number;
  deplaces: number;
  traites_conserves: number;
  hors_commune_devinee: number;
  demenagements: number;
  ml_cible_absente: number;
  doublons_soft_deleted: number;
  conflits_actifs: number;
  erreurs_api: number;
  ecritures_en_erreur: number;
  stats_en_erreur: number;
};

interface MigrateCommuneOptions {
  dryRun: boolean;
  limit?: number;
}

const nouveauRapport = (): RapportCollection => ({
  examines: 0,
  insee_erp: 0,
  precision: { voie: { ok: 0, ko: 0 }, commune: { ok: 0, ko: 0 }, population: { ok: 0, ko: 0 } },
  ecarts: [],
  devines: 0,
  inchanges: 0,
  modifies: 0,
  hors_api: 0,
  erreurs_api: 0,
  methodes: { voie: 0, commune: 0, population: 0 },
  changements_ml: 0,
  snapshots_ml: 0,
  batches_en_erreur: 0,
});

function texteAdresse(adresse: AdresseApprenant): string {
  return adresse.complete || [adresse.numero, adresse.voie].filter(Boolean).join(" ");
}

async function inseeTransmisParErp(effectifId: ObjectId): Promise<{ codeInsee: string; codePostal: unknown } | null> {
  const element = await effectifsQueueDb().findOne(
    { effectif_id: effectifId, processed_at: { $ne: null } },
    { sort: { created_at: -1 }, projection: { code_commune_insee_apprenant: 1, code_postal_apprenant: 1 } }
  );
  const codeInsee = element?.code_commune_insee_apprenant;
  if (typeof codeInsee !== "string" || !codeInsee.trim()) return null;
  return { codeInsee: codeInsee.trim(), codePostal: element?.code_postal_apprenant };
}

async function mesurerPrecision(
  stats: RapportCollection,
  params: { codePostal: string; texte: string; attendu: string }
) {
  const resolution = await resoudreCodeInsee({ codePostal: params.codePostal, adresse: params.texte });
  if (!resolution) return;
  const juste = resolution.code_insee === params.attendu;
  stats.precision[resolution.methode][juste ? "ok" : "ko"]++;
  if (!juste && stats.ecarts.length < MAX_ECARTS) {
    stats.ecarts.push({
      code_postal: params.codePostal,
      voie: normaliserVoie(params.texte)
        .replace(/\b\d+\b/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      attendu: params.attendu,
      obtenu: resolution.code_insee,
      methode: resolution.methode,
    });
  }
}

function communesDuCodePostalApi(): CommunesApi {
  const memo = new Map<string, Promise<ICommune[]>>();
  const echecs = new Map<string, number>();

  return async (codePostal) => {
    if ((echecs.get(codePostal) ?? 0) >= MAX_ECHECS_API) return null;

    let communes = memo.get(codePostal);
    if (!communes) {
      communes = apiAlternanceClient.geographie
        .rechercheCommune({ code: codePostal })
        .then((liste) => liste.filter(({ code }) => code.postaux.includes(codePostal)));
      memo.set(codePostal, communes);
    }

    try {
      return await communes;
    } catch (error) {
      if (memo.get(codePostal) === communes) {
        memo.delete(codePostal);
        echecs.set(codePostal, (echecs.get(codePostal) ?? 0) + 1);
        logger.warn({ error, codePostal }, "échec de la recherche des communes du code postal");
      }
      return null;
    }
  };
}

async function chargerCodesPostauxAmbigus(): Promise<string[]> {
  const docs = await communesVoiesDb()
    .find({}, { projection: { _id: 1 } })
    .toArray();
  return docs.map((doc) => doc._id);
}

function setAdresse(commune: ICommune) {
  return {
    commune: commune.nom,
    code_insee: commune.code.insee,
    departement: commune.departement.codeInsee,
    academie: commune.academie.code,
    region: commune.region.codeInsee,
    mission_locale_id: commune.mission_locale?.id ?? null,
  };
}

function prefixer<T extends Record<string, unknown>>(prefixe: string, valeurs: T) {
  return Object.fromEntries(Object.entries(valeurs).map(([cle, valeur]) => [`${prefixe}.${cle}`, valeur]));
}

async function rattraperCollection<E extends IEffectif | IEffectifDECA>(
  collection: Collection<E>,
  contexte: {
    codesPostaux: string[];
    effectifIds: ObjectId[];
    communesApi: CommunesApi;
    changementsMl: ChangementMissionLocale[];
    stats: RapportCollection;
    lireFileErp: boolean;
    dryRun: boolean;
    limit?: number;
  }
) {
  const { codesPostaux, effectifIds, communesApi, changementsMl, stats, lireFileErp, dryRun, limit } = contexte;
  let batch: Array<{ effectif: EffectifAdresse; commune: ICommune }> = [];

  const flush = async () => {
    if (batch.length === 0) return;
    const courant = batch;
    batch = [];
    if (dryRun) return;

    const opsEffectifs = courant.map(
      ({ effectif, commune }): AnyBulkWriteOperation<E> => ({
        updateOne: {
          filter: { _id: effectif._id } as Filter<E>,
          update: { $set: prefixer("apprenant.adresse", setAdresse(commune)) as Partial<E> },
        },
      })
    );
    let indexEnEchec = new Set<number>();
    try {
      await collection.bulkWrite(opsEffectifs, { ordered: false });
    } catch (error) {
      stats.batches_en_erreur++;
      logger.error({ error, collection: collection.collectionName }, "échec partiel du lot de rattrapage des communes");
      captureException(error);
      if (!(error instanceof MongoBulkWriteError)) return;
      indexEnEchec = new Set([error.writeErrors].flat().map(({ index }) => index));
    }

    const opsSnapshots = courant.flatMap(
      ({ effectif, commune }, index): AnyBulkWriteOperation<IMissionLocaleEffectif>[] =>
        indexEnEchec.has(index)
          ? []
          : [
              {
                updateMany: {
                  filter: {
                    effectif_id: effectif._id,
                    "effectif_snapshot.apprenant.adresse.code_postal": effectif.apprenant.adresse?.code_postal,
                  },
                  update: {
                    $set: prefixer(
                      "effectif_snapshot.apprenant.adresse",
                      setAdresse(commune)
                    ) as Partial<IMissionLocaleEffectif>,
                  },
                },
              },
            ]
    );
    if (opsSnapshots.length === 0) return;

    try {
      const { modifiedCount } = await missionLocaleEffectifsDb().bulkWrite(opsSnapshots, { ordered: false });
      stats.snapshots_ml += modifiedCount;
    } catch (error) {
      if (error instanceof MongoBulkWriteError) stats.snapshots_ml += error.result.modifiedCount;
      stats.batches_en_erreur++;
      logger.error({ error }, "échec partiel de la synchronisation des snapshots ML");
      captureException(error);
    }
  };

  const filtre: Filter<IEffectif | IEffectifDECA> = {
    $or: [{ _id: { $in: effectifIds } }, { annee_scolaire: { $in: getAnneesScolaireListFromDate(new Date()) } }],
    "apprenant.adresse.code_postal": { $in: codesPostaux },
  };
  const cursor = collection.find<EffectifAdresse>(filtre as Filter<E>, {
    projection: {
      "apprenant.adresse.code_postal": 1,
      "apprenant.adresse.code_insee": 1,
      "apprenant.adresse.complete": 1,
      "apprenant.adresse.numero": 1,
      "apprenant.adresse.voie": 1,
      "apprenant.adresse.mission_locale_id": 1,
    },
  });

  for await (const effectif of cursor) {
    if (limit && stats.examines >= limit) break;
    stats.examines++;

    const adresse = effectif.apprenant.adresse;
    const codePostal = adresse?.code_postal;
    if (!adresse || !codePostal) continue;

    const communes = await communesApi(codePostal);
    if (!communes) {
      stats.erreurs_api++;
      continue;
    }

    if (lireFileErp) {
      const transmis = await inseeTransmisParErp(effectif._id);
      if (transmis) {
        stats.insee_erp++;
        if (transmis.codePostal === codePostal && communes.some(({ code }) => code.insee === transmis.codeInsee)) {
          await mesurerPrecision(stats, { codePostal, texte: texteAdresse(adresse), attendu: transmis.codeInsee });
        }
        continue;
      }
    }

    if (adresse.code_insee && adresse.code_insee !== communes[0]?.code.insee) continue;
    stats.devines++;

    const resolution = await resoudreCodeInsee({ codePostal, adresse: texteAdresse(adresse) });
    if (!resolution || resolution.code_insee === adresse.code_insee) {
      stats.inchanges++;
      continue;
    }

    const commune = communes.find(({ code }) => code.insee === resolution.code_insee);
    if (!commune) {
      stats.hors_api++;
      continue;
    }

    stats.modifies++;
    stats.methodes[resolution.methode]++;

    const nouveauMlId = commune.mission_locale?.id ?? null;
    const ancienMlId = adresse.mission_locale_id ?? null;
    if (nouveauMlId !== ancienMlId) {
      stats.changements_ml++;
      changementsMl.push({
        effectif_id: effectif._id,
        code_postal: codePostal,
        ancien_ml_id: ancienMlId,
        nouveau_ml_id: nouveauMlId,
      });
    }

    batch.push({ effectif, commune });
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await cursor.close();
  await flush();
  logger.info(
    { collection: collection.collectionName, ...stats },
    "rattrapage des communes terminé pour la collection"
  );
}

async function adresseEffectif(dossier: IMissionLocaleEffectif): Promise<AdresseApprenant | null> {
  const projection = { "apprenant.adresse": 1 };
  const chercherErp = () => effectifsDb().findOne({ _id: dossier.effectif_id }, { projection });
  const chercherDeca = () => effectifsDECADb().findOne({ _id: dossier.effectif_id }, { projection });
  const [premier, second] = isDecaSnapshot(dossier.effectif_snapshot)
    ? [chercherDeca, chercherErp]
    : [chercherErp, chercherDeca];
  const effectif = (await premier()) ?? (await second());
  return effectif?.apprenant.adresse ?? null;
}

/**
 * Déplace vers la ML de leur commune corrigée les dossiers non traités encore rattachés à la ML de
 * la commune devinée pour leur code postal. Travaille sur l'état de la base : les corrections faites
 * entre-temps par l'ingestion sont prises en compte, et le job peut être relancé.
 */
async function reaffecterDossiersMl(contexte: {
  codesPostaux: string[];
  communesApi: CommunesApi;
  changementsMl: ChangementMissionLocale[];
  dryRun: boolean;
}) {
  const { codesPostaux, communesApi, changementsMl, dryRun } = contexte;
  const rapport: RapportReaffectation = {
    examines: 0,
    candidats: 0,
    deplaces: 0,
    traites_conserves: 0,
    hors_commune_devinee: 0,
    demenagements: 0,
    ml_cible_absente: 0,
    doublons_soft_deleted: 0,
    conflits_actifs: 0,
    erreurs_api: 0,
    ecritures_en_erreur: 0,
    stats_en_erreur: 0,
  };
  const dossiersTraites: Array<{ dossier_id: ObjectId; ml_actuelle: number; ml_cible: number }> = [];
  const doublonsCible: Array<{ dossier_id: ObjectId; doublon_id: ObjectId; ml_cible: number }> = [];
  const missionLocalesModifiees = new Map<string, ObjectId>();
  const changementParEffectif = new Map(changementsMl.map((c) => [c.effectif_id.toString(), c]));

  const organisations = (await organisationsDb()
    .find({ type: "MISSION_LOCALE" })
    .toArray()) as IOrganisationMissionLocale[];
  const parMlId = new Map(organisations.map((o) => [o.ml_id, o]));
  const parId = new Map(organisations.map((o) => [o._id.toString(), o]));

  const cursor = missionLocaleEffectifsDb().find({
    soft_deleted: { $ne: true },
    "effectif_snapshot.apprenant.adresse.code_postal": { $in: codesPostaux },
  });

  for await (const dossier of cursor) {
    rapport.examines++;
    const actuelle = parId.get(dossier.mission_locale_id.toString());
    const codePostal = dossier.effectif_snapshot.apprenant.adresse?.code_postal;
    if (!actuelle || typeof codePostal !== "string") continue;

    const changement = changementParEffectif.get(dossier.effectif_id.toString());
    let mlEffectif: number | null;
    let adresseCorrigee: AdresseApprenant | undefined;
    if (changement) {
      if (changement.code_postal !== codePostal) {
        if (changement.nouveau_ml_id !== actuelle.ml_id) rapport.demenagements++;
        continue;
      }
      mlEffectif = changement.nouveau_ml_id;
    } else {
      const adresse = await adresseEffectif(dossier);
      if (!adresse) continue;
      adresseCorrigee = adresse;
      if (adresse.code_postal !== codePostal) {
        if ((adresse.mission_locale_id ?? null) !== actuelle.ml_id) rapport.demenagements++;
        continue;
      }
      mlEffectif = adresse.mission_locale_id ?? null;
    }
    if (mlEffectif === actuelle.ml_id) continue;

    const communes = await communesApi(codePostal);
    if (!communes) {
      rapport.erreurs_api++;
      continue;
    }
    if (communes[0]?.mission_locale?.id !== actuelle.ml_id) {
      rapport.hors_commune_devinee++;
      continue;
    }
    rapport.candidats++;

    const cible = mlEffectif === null ? undefined : parMlId.get(mlEffectif);
    if (!cible) {
      rapport.ml_cible_absente++;
      continue;
    }
    if (await estDossierMlTraite(dossier)) {
      rapport.traites_conserves++;
      dossiersTraites.push({ dossier_id: dossier._id, ml_actuelle: actuelle.ml_id, ml_cible: cible.ml_id });
      continue;
    }

    const doublon = await missionLocaleEffectifsDb().findOne({
      mission_locale_id: cible._id,
      effectif_id: dossier.effectif_id,
    });
    if (doublon?.soft_deleted) {
      rapport.doublons_soft_deleted++;
      doublonsCible.push({ dossier_id: dossier._id, doublon_id: doublon._id, ml_cible: cible.ml_id });
      continue;
    }
    if (doublon) {
      rapport.conflits_actifs++;
      continue;
    }

    rapport.deplaces++;
    if (dryRun) continue;

    try {
      const snapshot = adresseCorrigee ? { "effectif_snapshot.apprenant.adresse": adresseCorrigee } : {};
      await missionLocaleEffectifsDb().updateOne(
        { _id: dossier._id },
        cible.activated_at
          ? {
              $set: {
                ...snapshot,
                mission_locale_id: cible._id,
                "computed.mission_locale.activated_at": cible.activated_at,
                updated_at: new Date(),
              },
            }
          : {
              $set: { ...snapshot, mission_locale_id: cible._id, updated_at: new Date() },
              $unset: { "computed.mission_locale": "" },
            }
      );
      missionLocalesModifiees.set(dossier.mission_locale_id.toString(), dossier.mission_locale_id);
      missionLocalesModifiees.set(cible._id.toString(), cible._id);
    } catch (error) {
      rapport.ecritures_en_erreur++;
      logger.error({ error, dossier: dossier._id }, "échec du déplacement du dossier vers sa nouvelle ML");
      captureException(error);
    }
  }

  for (const [mlId, missionLocaleId] of missionLocalesModifiees) {
    try {
      await createOrUpdateMissionLocaleStats(missionLocaleId);
    } catch (error) {
      rapport.stats_en_erreur++;
      logger.error({ error, mlId }, "échec du recalcul des stats de la Mission Locale");
      captureException(error);
    }
  }

  logger.info({ dossiers: dossiersTraites }, "dossiers traités laissés dans leur Mission Locale actuelle");
  logger.info({ dossiers: doublonsCible }, "dossiers non déplacés : doublon soft-deleted dans la ML cible");
  return { rapport, dossiersTraites, doublonsCible };
}

/**
 * Recalcule la commune des apprenants suivis par une Mission Locale ou de l'année scolaire en cours
 * (listes CFA) dont la commune avait été devinée depuis un code postal partagé (première commune d'API
 * Apprentissage, ou commune absente), répercute l'adresse sur les snapshots des dossiers Mission Locale,
 * puis déplace les dossiers non traités vers leur nouvelle ML.
 */
export async function migrateCommuneApprenant({ dryRun, limit }: MigrateCommuneOptions) {
  if (limit && !dryRun) {
    throw new Error("--limit n'est autorisé qu'avec --dry-run");
  }
  const codesPostaux = await chargerCodesPostauxAmbigus();
  if (codesPostaux.length === 0) {
    throw new Error("Référentiel communesVoies vide : lancer hydrate:communes-voies avant ce job");
  }

  const effectifIds = await missionLocaleEffectifsDb().distinct("effectif_id", { soft_deleted: { $ne: true } });
  const communesApi = communesDuCodePostalApi();
  const changementsMl: ChangementMissionLocale[] = [];
  const contexte = { codesPostaux, effectifIds, communesApi, changementsMl, dryRun, limit };
  const rapport = { dryRun, effectifs: nouveauRapport(), effectifsDECA: nouveauRapport() };

  await rattraperCollection(effectifsDb(), { ...contexte, stats: rapport.effectifs, lireFileErp: true });
  await rattraperCollection(effectifsDECADb(), { ...contexte, stats: rapport.effectifsDECA, lireFileErp: false });

  const reaffectation = await reaffecterDossiersMl(contexte);

  const rapportComplet = { ...rapport, reaffectation: reaffectation.rapport };
  logger.info(rapportComplet, "rattrapage des communes terminé");
  return {
    rapport: rapportComplet,
    changementsMl,
    dossiersTraites: reaffectation.dossiersTraites,
    doublonsCible: reaffectation.doublonsCible,
  };
}
