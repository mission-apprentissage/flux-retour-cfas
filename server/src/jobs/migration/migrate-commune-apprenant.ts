import { captureException } from "@sentry/node";
import type { ICommune } from "api-alternance-sdk";
import type { AnyBulkWriteOperation, Collection, Filter, ObjectId } from "mongodb";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import type { IMissionLocaleEffectif } from "shared/models/data/missionLocaleEffectif.model";
import type { IOrganisationMissionLocale } from "shared/models/data/organisations.model";

import { createOrUpdateMissionLocaleStats } from "@/common/actions/mission-locale/mission-locale-stats.actions";
import { apiAlternanceClient } from "@/common/apis/apiAlternance/client";
import parentLogger from "@/common/logger";
import {
  communesVoiesDb,
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  organisationsDb,
} from "@/common/model/collections";
import { resoudreCodeInsee, type ResolutionCodeInsee } from "@/common/services/commune/resoudreCodeInsee";

const logger = parentLogger.child({ module: "job:migrate:commune-apprenant" });

const BATCH_SIZE = 1_000;

type AdresseApprenant = {
  code_postal?: string | null;
  code_insee?: string | null;
  complete?: string | null;
  numero?: number | string | null;
  voie?: string | null;
  mission_locale_id?: number | null;
};

type EffectifAdresse = { _id: ObjectId; apprenant: { adresse?: AdresseApprenant | null } };

export type ChangementMissionLocale = {
  effectif_id: ObjectId;
  ancien_ml_id: number | null;
  nouveau_ml_id: number | null;
};

type RapportCollection = {
  examines: number;
  devines: number;
  inchanges: number;
  modifies: number;
  hors_api: number;
  methodes: Record<ResolutionCodeInsee["methode"], number>;
  changements_ml: number;
  snapshots_ml: number;
  batches_en_erreur: number;
};

interface MigrateCommuneOptions {
  dryRun: boolean;
  limit?: number;
}

const nouveauRapport = (): RapportCollection => ({
  examines: 0,
  devines: 0,
  inchanges: 0,
  modifies: 0,
  hors_api: 0,
  methodes: { voie: 0, commune: 0, population: 0 },
  changements_ml: 0,
  snapshots_ml: 0,
  batches_en_erreur: 0,
});

function texteAdresse(adresse: AdresseApprenant): string {
  return adresse.complete || [adresse.numero, adresse.voie].filter(Boolean).join(" ");
}

function communesDuCodePostalApi() {
  const memo = new Map<string, Promise<ICommune[]>>();
  return (codePostal: string) => {
    let communes = memo.get(codePostal);
    if (!communes) {
      communes = apiAlternanceClient.geographie
        .rechercheCommune({ code: codePostal })
        .then((liste) => liste.filter(({ code }) => code.postaux.includes(codePostal)));
      memo.set(codePostal, communes);
    }
    return communes;
  };
}

async function chargerPlusPetitInsee(): Promise<Map<string, string>> {
  const docs = await communesVoiesDb()
    .find({}, { projection: { communes: 1 } })
    .toArray();
  return new Map(docs.map((doc) => [doc._id, doc.communes.map((c) => c.code_insee).sort()[0]]));
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
    plusPetitInsee: Map<string, string>;
    communesApi: (codePostal: string) => Promise<ICommune[]>;
    changementsMl: ChangementMissionLocale[];
    stats: RapportCollection;
    dryRun: boolean;
    limit?: number;
  }
) {
  const { plusPetitInsee, communesApi, changementsMl, stats, dryRun, limit } = contexte;
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
    const opsSnapshots = courant.map(
      ({ effectif, commune }): AnyBulkWriteOperation<IMissionLocaleEffectif> => ({
        updateMany: {
          filter: { effectif_id: effectif._id },
          update: {
            $set: prefixer(
              "effectif_snapshot.apprenant.adresse",
              setAdresse(commune)
            ) as Partial<IMissionLocaleEffectif>,
          },
        },
      })
    );

    try {
      await collection.bulkWrite(opsEffectifs, { ordered: false });
      const { modifiedCount } = await missionLocaleEffectifsDb().bulkWrite(opsSnapshots, { ordered: false });
      stats.snapshots_ml += modifiedCount;
    } catch (error) {
      stats.batches_en_erreur++;
      logger.error({ error, collection: collection.collectionName }, "échec partiel du lot de rattrapage des communes");
      captureException(error);
    }
  };

  const filtre: Filter<IEffectif | IEffectifDECA> = {
    "apprenant.adresse.code_postal": { $in: [...plusPetitInsee.keys()] },
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

    const inseeDevine = plusPetitInsee.get(codePostal);
    if (adresse.code_insee && adresse.code_insee !== inseeDevine) continue;
    stats.devines++;

    const resolution = await resoudreCodeInsee({ codePostal, adresse: texteAdresse(adresse) });
    if (!resolution || resolution.code_insee === adresse.code_insee) {
      stats.inchanges++;
      continue;
    }

    const commune = (await communesApi(codePostal)).find(({ code }) => code.insee === resolution.code_insee);
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
      changementsMl.push({ effectif_id: effectif._id, ancien_ml_id: ancienMlId, nouveau_ml_id: nouveauMlId });
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

type RapportReaffectation = {
  dossiers: number;
  deplaces: number;
  traites_conserves: number;
  deja_dans_la_bonne_ml: number;
  hors_ancienne_ml: number;
  ml_cible_absente: number;
  doublons_supprimes: number;
  conflits_actifs: number;
  ecritures_en_erreur: number;
  stats_en_erreur: number;
};

async function estTraite(dossier: IMissionLocaleEffectif): Promise<boolean> {
  if (
    dossier.situation ||
    dossier.whatsapp_contact ||
    dossier.cfa_rupture_declaration ||
    dossier.organisme_data?.acc_conjoint === true ||
    dossier.organisme_data?.reponse_at ||
    dossier.souhaite_rdv === true
  ) {
    return true;
  }
  const log = await missionLocaleEffectifsLogDb().findOne(
    { mission_locale_effectif_id: dossier._id },
    { projection: { _id: 1 } }
  );
  return log !== null;
}

/**
 * Déplace vers leur nouvelle Mission Locale les dossiers non traités des effectifs dont la ML a
 * changé avec la commune. Les dossiers traités restent dans leur ML actuelle.
 */
async function reaffecterDossiersMl(changementsMl: ChangementMissionLocale[], dryRun: boolean) {
  const rapport: RapportReaffectation = {
    dossiers: 0,
    deplaces: 0,
    traites_conserves: 0,
    deja_dans_la_bonne_ml: 0,
    hors_ancienne_ml: 0,
    ml_cible_absente: 0,
    doublons_supprimes: 0,
    conflits_actifs: 0,
    ecritures_en_erreur: 0,
    stats_en_erreur: 0,
  };
  const dossiersTraites: Array<{ dossier_id: ObjectId; ml_actuelle: number | null; ml_cible: number }> = [];
  const missionLocalesModifiees = new Map<string, ObjectId>();

  const organisations = (await organisationsDb()
    .find({ type: "MISSION_LOCALE" })
    .toArray()) as IOrganisationMissionLocale[];
  const parMlId = new Map(organisations.map((o) => [o.ml_id, o]));
  const parId = new Map(organisations.map((o) => [o._id.toString(), o]));

  for (const changement of changementsMl) {
    const dossiers = await missionLocaleEffectifsDb()
      .find({ effectif_id: changement.effectif_id, soft_deleted: { $ne: true } })
      .toArray();

    for (const dossier of dossiers) {
      rapport.dossiers++;
      const cible = changement.nouveau_ml_id === null ? undefined : parMlId.get(changement.nouveau_ml_id);
      const actuelle = parId.get(dossier.mission_locale_id.toString());

      if (!cible) {
        rapport.ml_cible_absente++;
        continue;
      }
      if (cible._id.equals(dossier.mission_locale_id)) {
        rapport.deja_dans_la_bonne_ml++;
        continue;
      }
      if ((actuelle?.ml_id ?? null) !== changement.ancien_ml_id) {
        rapport.hors_ancienne_ml++;
        continue;
      }
      if (await estTraite(dossier)) {
        rapport.traites_conserves++;
        dossiersTraites.push({ dossier_id: dossier._id, ml_actuelle: actuelle?.ml_id ?? null, ml_cible: cible.ml_id });
        continue;
      }

      const doublon = await missionLocaleEffectifsDb().findOne({
        mission_locale_id: cible._id,
        effectif_id: dossier.effectif_id,
      });
      if (doublon && !doublon.soft_deleted) {
        rapport.conflits_actifs++;
        continue;
      }

      rapport.deplaces++;
      if (dryRun) continue;

      try {
        if (doublon) {
          await missionLocaleEffectifsDb().deleteOne({ _id: doublon._id, soft_deleted: true });
          rapport.doublons_supprimes++;
          logger.info({ doublon: doublon._id, dossier: dossier._id }, "doublon soft-deleted supprimé dans la ML cible");
        }
        await missionLocaleEffectifsDb().updateOne(
          { _id: dossier._id },
          cible.activated_at
            ? {
                $set: {
                  mission_locale_id: cible._id,
                  "computed.mission_locale.activated_at": cible.activated_at,
                  updated_at: new Date(),
                },
              }
            : {
                $set: { mission_locale_id: cible._id, updated_at: new Date() },
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
  return { rapport, dossiersTraites };
}

/**
 * Recalcule la commune des apprenants dont la commune avait été devinée depuis un code postal
 * partagé (plus petit code INSEE du code postal, ou commune absente), répercute l'adresse sur les
 * snapshots des dossiers Mission Locale, puis déplace les dossiers non traités dont la ML a changé.
 */
export async function migrateCommuneApprenant({ dryRun, limit }: MigrateCommuneOptions) {
  const plusPetitInsee = await chargerPlusPetitInsee();
  if (plusPetitInsee.size === 0) {
    throw new Error("Référentiel communesVoies vide : lancer hydrate:communes-voies avant ce job");
  }

  const contexte = { plusPetitInsee, communesApi: communesDuCodePostalApi(), changementsMl: [], dryRun, limit };
  const changementsMl: ChangementMissionLocale[] = contexte.changementsMl;
  const rapport = { dryRun, effectifs: nouveauRapport(), effectifsDECA: nouveauRapport() };

  await rattraperCollection(effectifsDb(), { ...contexte, stats: rapport.effectifs });
  await rattraperCollection(effectifsDECADb(), { ...contexte, stats: rapport.effectifsDECA });

  const reaffectation = await reaffecterDossiersMl(changementsMl, dryRun);

  const rapportComplet = { ...rapport, reaffectation: reaffectation.rapport };
  logger.info(rapportComplet, "rattrapage des communes terminé");
  return { rapport: rapportComplet, changementsMl, dossiersTraites: reaffectation.dossiersTraites };
}
