import { ObjectId } from "bson";
import type { Document } from "mongodb";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type {
  CfaCollabMlSortBy,
  ICfaCollabMlResponse,
  ICfaCollabMlRow,
  ICfaCollaborationStats,
  ICollaborationSegmentStats,
  ICollabSituations,
  StatsPeriod,
} from "shared/models/data/nationalStats.model";
import { normalizeToUTCDay } from "shared/utils/date";
import { getBornesNaissanceMissionLocale } from "shared/utils/missionLocaleAge";

import { getNpsStatsForOrganismes } from "@/common/actions/cfa/cfa-collaboration-stats.actions";
import { RESULTAT_SITUATIONS } from "@/common/actions/mission-locale/collaboration-dossiers.actions";
import {
  buildCollabPerimetreMatch,
  DEFAULT_MOTIFS,
  getCollaborationMensuelStats,
  MOTIFS_PIPELINE,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import {
  calculateStartDateAsync,
  createStatWithVariation,
} from "@/common/actions/mission-locale/mission-locale-stats.helpers";
import {
  addCollabSituationField,
  addPremiereActiviteMlField,
  DEJA_CONNU_ACCOMPAGNE_CONDITION,
  DELAI_PREMIERE_ACTIVITE_EXPR,
  HAS_PREMIERE_ACTIVITE_CONDITION,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";

const buildCollabDossiersMatch = (perimetre: Record<string, unknown>, now: Date) => ({
  ...perimetre,
  "organisme_data.acc_conjoint": true,
  "organisme_data.acc_conjoint_at": { $lte: now },
  soft_deleted: { $ne: true },
});

const buildCfaCollabMatch = (organismeId: ObjectId, now: Date) =>
  buildCollabDossiersMatch({ "effectif_snapshot.organisme_id": organismeId }, now);

const countIf = (condition: Document) => ({ $sum: { $cond: [condition, 1, 0] } });
const situationIn = (situations: SITUATION_ENUM[]) => ({ $in: [{ $ifNull: ["$situation", null] }, situations] });

const EMPTY_SITUATIONS: ICollabSituations = {
  rupture: 0,
  abandon: 0,
  prevention_inevitable: 0,
  prevention_tres_eleve: 0,
  prevention_modere: 0,
  besoin_aide_hors_rupture: 0,
  total: 0,
};

type Kpis = {
  envoyes: number;
  traites: number;
  deja_connus: number;
  delai_total: number;
  delai_count: number;
} & Record<keyof typeof RESULTAT_SITUATIONS, number>;

async function fetchMlUserIds(match: Document) {
  const missionLocaleIds = await missionLocaleEffectifsDb().distinct("mission_locale_id", match);
  if (missionLocaleIds.length === 0) return [];
  return usersMigrationDb().distinct("_id", { organisation_id: { $in: missionLocaleIds } });
}

type CollabFacets = {
  kpis: Kpis[];
  situations: Array<{ _id: keyof ICollabSituations; n: number }>;
  motifs: Array<Record<string, number>>;
};

/** Chiffres des dossiers de collaboration d'un périmètre, à leur situation actuelle (règles des snapshots ML). */
async function aggregateCollabDossiers(match: Document, now: Date) {
  const mlUserIds = await fetchMlUserIds(match);
  const resultatsAccumulators = Object.fromEntries(
    Object.entries(RESULTAT_SITUATIONS).map(([cle, situations]) => [cle, countIf(situationIn(situations))])
  );

  const facets = await missionLocaleEffectifsDb()
    .aggregate<CollabFacets>([
      { $match: match },
      {
        $lookup: {
          from: "missionLocaleEffectifLog",
          localField: "_id",
          foreignField: "mission_locale_effectif_id",
          pipeline: [{ $match: { created_at: { $lte: now } } }, { $project: { created_at: 1, created_by: 1 } }],
          as: "filteredLogs",
        },
      },
      { $addFields: { computed_connaissance_ml: "$connaissance_ml", computed_deja_connu: "$deja_connu" } },
      addCollabSituationField(),
      addPremiereActiviteMlField(mlUserIds),
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                envoyes: { $sum: 1 },
                traites: countIf({ $ne: [{ $ifNull: ["$situation", null] }, null] }),
                deja_connus: countIf({
                  $and: [{ $ne: [{ $ifNull: ["$situation", null] }, null] }, DEJA_CONNU_ACCOMPAGNE_CONDITION],
                }),
                delai_total: {
                  $sum: { $cond: [HAS_PREMIERE_ACTIVITE_CONDITION, DELAI_PREMIERE_ACTIVITE_EXPR, 0] },
                },
                delai_count: countIf(HAS_PREMIERE_ACTIVITE_CONDITION),
                ...resultatsAccumulators,
              },
            },
          ],
          situations: [{ $group: { _id: "$collab_situation", n: { $sum: 1 } } }],
          motifs: MOTIFS_PIPELINE,
        },
      },
    ])
    .next();

  return {
    kpis: facets?.kpis[0],
    situations: toSituations(facets?.situations ?? []),
    motifs: { ...DEFAULT_MOTIFS, ...facets?.motifs[0] },
  };
}

const toSituations = (rows: CollabFacets["situations"]): ICollabSituations => {
  const situations = { ...EMPTY_SITUATIONS };
  for (const { _id, n } of rows) {
    if (_id in situations) situations[_id] = n;
    situations.total += n;
  }
  return situations;
};

const toObjectifs = (motifs: Record<string, number>, totalDossiers: number) => ({
  mobilite: motifs.mobilite || 0,
  logement: motifs.logement || 0,
  sante: motifs.sante || 0,
  finance: motifs.finance || 0,
  administratif: motifs.administratif || 0,
  social_familial: motifs.social_familial || 0,
  reorientation: motifs.reorientation || 0,
  recherche_emploi: motifs.recherche_emploi || 0,
  autre: motifs.autre || 0,
  total_dossiers: totalDossiers,
});

const sansVariation = (current: number) => ({ current, variation: "" });

const toResultats = (kpis: Kpis | undefined) => ({
  rdv_pris: sansVariation(kpis?.rdv_pris ?? 0),
  projet_pro_securise: sansVariation(kpis?.projet_pro_securise ?? 0),
  ne_souhaite_pas_accompagnement: sansVariation(kpis?.ne_souhaite_pas_accompagnement ?? 0),
  a_recontacter: sansVariation(kpis?.a_recontacter ?? 0),
  injoignable: sansVariation(kpis?.injoignable ?? 0),
  autre: sansVariation(kpis?.autre ?? 0),
  total: kpis?.traites ?? 0,
});

const partDejaConnus = (kpis: Kpis | undefined) =>
  kpis?.traites ? Math.round((kpis.deja_connus / kpis.traites) * 100) : 0;

const delaiMoyen = (kpis: Kpis | undefined) =>
  kpis?.delai_count ? Math.round((kpis.delai_total / kpis.delai_count) * 10) / 10 : null;

/** Mêmes règles que les snapshots ML (situation du jeune, délai de première action ML, déjà connus), limitées à un CFA. */
export async function getCfaCollaborationStats(
  organismeId: ObjectId,
  now: Date = new Date()
): Promise<ICfaCollaborationStats> {
  const [{ kpis, situations, motifs }, nps, mensuel] = await Promise.all([
    aggregateCollabDossiers(buildCfaCollabMatch(organismeId, now), now),
    getNpsStatsForOrganismes([organismeId]),
    getCollaborationMensuelStats("all", undefined, undefined, organismeId),
  ]);

  return {
    envoyes: kpis?.envoyes ?? 0,
    contactes: kpis?.traites ?? 0,
    acceptes: kpis?.rdv_pris ?? 0,
    resultats: toResultats(kpis),
    part_deja_connus: partDejaConnus(kpis),
    delai_moyen_jours: delaiMoyen(kpis),
    situations,
    objectifs: toObjectifs(motifs, kpis?.envoyes ?? 0),
    nps,
    mensuel: mensuel.mois,
  };
}

/**
 * Chiffres clés des collaborations d'un territoire, comptées côté CFA (décision 1.1) et calculées à partir des
 * dossiers. Seuls les chiffres qui ne dépendent que de l'envoi (jeunes envoyés, CFA, situations) ont une variation :
 * la situation passée des dossiers n'est pas connue sans rejouer leur historique.
 */
export async function getTerritoireCollaborationStats(
  period: StatsPeriod,
  regions?: string[],
  now: Date = new Date()
): Promise<ICollaborationSegmentStats> {
  const evaluationDate = normalizeToUTCDay(now);
  const startDate = await calculateStartDateAsync(period, evaluationDate);
  const { nesApres, nesAvant } = getBornesNaissanceMissionLocale();
  const perimetre = {
    ...(await buildCollabPerimetreMatch(regions)),
    "effectif_snapshot.apprenant.date_de_naissance": { $gte: nesApres, $lte: nesAvant },
  };
  const matchAu = (date: Date) => buildCollabDossiersMatch(perimetre, date);
  const compterCfa = async (date: Date) =>
    (await missionLocaleEffectifsDb().distinct("effectif_snapshot.organisme_id", matchAu(date))).length;

  const [actuel, cfaActuels, cfaDebut, situationsDebut] = await Promise.all([
    aggregateCollabDossiers(matchAu(now), now),
    compterCfa(now),
    compterCfa(startDate),
    missionLocaleEffectifsDb()
      .aggregate<CollabFacets["situations"][number]>([
        { $match: matchAu(startDate) },
        addCollabSituationField(),
        { $group: { _id: "$collab_situation", n: { $sum: 1 } } },
      ])
      .toArray()
      .then(toSituations),
  ]);
  const { kpis, situations, motifs } = actuel;
  const variationSituation = (cle: Exclude<keyof ICollabSituations, "total">) =>
    createStatWithVariation(situations[cle], situationsDebut[cle]).variation;

  return {
    evaluationDate,
    period,
    cfa_ayant_collabore: createStatWithVariation(cfaActuels, cfaDebut),
    jeunes_envoyes: createStatWithVariation(situations.total, situationsDebut.total),
    jeunes_contactes: sansVariation(kpis?.traites ?? 0),
    jeunes_accompagnement_accepte: sansVariation(kpis?.rdv_pris ?? 0),
    resultats: toResultats(kpis),
    part_deja_connus: partDejaConnus(kpis),
    delai_moyen_jours: delaiMoyen(kpis),
    situations,
    situations_variations: {
      rupture: variationSituation("rupture"),
      abandon: variationSituation("abandon"),
      prevention_inevitable: variationSituation("prevention_inevitable"),
      prevention_tres_eleve: variationSituation("prevention_tres_eleve"),
      prevention_modere: variationSituation("prevention_modere"),
      besoin_aide_hors_rupture: variationSituation("besoin_aide_hors_rupture"),
    },
    objectifs: toObjectifs(motifs, kpis?.envoyes ?? 0),
  };
}

const collator = new Intl.Collator("fr", { sensitivity: "base" });

const ML_COMPARATORS: Record<CfaCollabMlSortBy, (a: ICfaCollabMlRow, b: ICfaCollabMlRow) => number> = {
  envoyees: (a, b) => a.envoyees - b.envoyees,
  a_traiter: (a, b) => a.a_traiter - b.a_traiter,
  traitees: (a, b) => a.traitees - b.traitees,
  nom: (a, b) => collator.compare(a.nom ?? "", b.nom ?? ""),
};

export async function listCfaCollaborationsParMl(
  organismeId: ObjectId,
  userRegions: string[],
  options: { page: number; limit: number; sort_by: CfaCollabMlSortBy; sort_order: "asc" | "desc" },
  now: Date = new Date()
): Promise<ICfaCollabMlResponse> {
  const groupes = await missionLocaleEffectifsDb()
    .aggregate<{ _id: ObjectId; envoyees: number; a_traiter: number; a_recontacter: number; traitees: number }>([
      { $match: buildCfaCollabMatch(organismeId, now) },
      {
        $group: {
          _id: "$mission_locale_id",
          envoyees: { $sum: 1 },
          a_traiter: countIf({ $eq: [{ $ifNull: ["$situation", null] }, null] }),
          a_recontacter: countIf({ $eq: ["$situation", SITUATION_ENUM.CONTACTE_SANS_RETOUR] }),
          traitees: countIf({
            $not: [{ $in: [{ $ifNull: ["$situation", null] }, [null, SITUATION_ENUM.CONTACTE_SANS_RETOUR]] }],
          }),
        },
      },
    ])
    .toArray();

  const missionsLocales = await organisationsDb()
    .find(
      { _id: { $in: groupes.map((groupe) => groupe._id) } },
      { projection: { nom: 1, "adresse.code_postal": 1, "adresse.commune": 1, "adresse.region": 1, activated_at: 1 } }
    )
    .toArray();
  type MlProjection = {
    nom?: string;
    adresse?: { code_postal?: string; commune?: string; region?: string };
    activated_at?: Date;
  };
  const mlById = new Map(missionsLocales.map((ml) => [ml._id.toString(), ml as MlProjection]));

  const rows = groupes.map((groupe): ICfaCollabMlRow => {
    const ml = mlById.get(groupe._id.toString());
    return {
      mission_locale_id: groupe._id.toString(),
      nom: ml?.nom?.trim() ?? null,
      code_postal: ml?.adresse?.code_postal ?? null,
      commune: ml?.adresse?.commune ?? null,
      utilise_service: Boolean(ml?.activated_at),
      dans_perimetre: userRegions.length === 0 || userRegions.includes(ml?.adresse?.region ?? ""),
      envoyees: groupe.envoyees,
      a_traiter: groupe.a_traiter,
      a_recontacter: groupe.a_recontacter,
      traitees: groupe.traitees,
    };
  });

  const direction = options.sort_order === "asc" ? 1 : -1;
  rows.sort((a, b) => direction * ML_COMPARATORS[options.sort_by](a, b) || collator.compare(a.nom ?? "", b.nom ?? ""));

  const { page, limit } = options;
  return {
    total: rows.length,
    pagination: { page, limit, total_pages: Math.ceil(rows.length / limit) },
    data: rows.slice((page - 1) * limit, page * limit),
  };
}
