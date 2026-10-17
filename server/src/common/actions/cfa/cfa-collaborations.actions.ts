import { ObjectId } from "bson";
import type { Document } from "mongodb";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import type {
  CfaCollabMlSortBy,
  ICfaCollabMlResponse,
  ICfaCollabMlRow,
  ICfaCollaborationStats,
  ICollabSituations,
} from "shared/models/data/nationalStats.model";

import { getNpsStatsForOrganismes } from "@/common/actions/cfa/cfa-collaboration-stats.actions";
import { RESULTAT_SITUATIONS } from "@/common/actions/mission-locale/collaboration-dossiers.actions";
import {
  DEFAULT_MOTIFS,
  getCollaborationMensuelStats,
  MOTIFS_PIPELINE,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import {
  addCollabSituationField,
  addPremiereActiviteMlField,
  DEJA_CONNU_ACCOMPAGNE_CONDITION,
  DELAI_PREMIERE_ACTIVITE_EXPR,
  HAS_PREMIERE_ACTIVITE_CONDITION,
} from "@/common/actions/mission-locale/mission-locale.actions";
import { missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";

const buildCfaCollabMatch = (organismeId: ObjectId, now: Date) => ({
  "effectif_snapshot.organisme_id": organismeId,
  "organisme_data.acc_conjoint": true,
  "organisme_data.acc_conjoint_at": { $lte: now },
  soft_deleted: { $ne: true },
});

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

async function fetchMlUserIds(organismeId: ObjectId, now: Date) {
  const missionLocaleIds = await missionLocaleEffectifsDb().distinct(
    "mission_locale_id",
    buildCfaCollabMatch(organismeId, now)
  );
  if (missionLocaleIds.length === 0) return [];
  return usersMigrationDb().distinct("_id", { organisation_id: { $in: missionLocaleIds } });
}

/** Mêmes règles que les snapshots ML (situation du jeune, délai de première action ML, déjà connus), limitées à un CFA. */
export async function getCfaCollaborationStats(
  organismeId: ObjectId,
  now: Date = new Date()
): Promise<ICfaCollaborationStats> {
  const mlUserIds = await fetchMlUserIds(organismeId, now);
  const resultatsAccumulators = Object.fromEntries(
    Object.entries(RESULTAT_SITUATIONS).map(([cle, situations]) => [cle, countIf(situationIn(situations))])
  );

  const [facets, nps, mensuel] = await Promise.all([
    missionLocaleEffectifsDb()
      .aggregate<{
        kpis: Kpis[];
        situations: Array<{ _id: keyof ICollabSituations; n: number }>;
        motifs: Array<Record<string, number>>;
      }>([
        { $match: buildCfaCollabMatch(organismeId, now) },
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
      .next(),
    getNpsStatsForOrganismes([organismeId]),
    getCollaborationMensuelStats("all", undefined, undefined, organismeId),
  ]);

  const kpis = facets?.kpis[0];
  const situations = { ...EMPTY_SITUATIONS };
  for (const { _id, n } of facets?.situations ?? []) {
    if (_id in situations) situations[_id] = n;
    situations.total += n;
  }
  const motifs = { ...DEFAULT_MOTIFS, ...facets?.motifs[0] };
  const sansVariation = (current: number) => ({ current, variation: "" });

  return {
    envoyes: kpis?.envoyes ?? 0,
    contactes: kpis?.traites ?? 0,
    acceptes: kpis?.rdv_pris ?? 0,
    resultats: {
      rdv_pris: sansVariation(kpis?.rdv_pris ?? 0),
      projet_pro_securise: sansVariation(kpis?.projet_pro_securise ?? 0),
      ne_souhaite_pas_accompagnement: sansVariation(kpis?.ne_souhaite_pas_accompagnement ?? 0),
      a_recontacter: sansVariation(kpis?.a_recontacter ?? 0),
      injoignable: sansVariation(kpis?.injoignable ?? 0),
      autre: sansVariation(kpis?.autre ?? 0),
      total: kpis?.traites ?? 0,
    },
    part_deja_connus: kpis?.traites ? Math.round((kpis.deja_connus / kpis.traites) * 100) : 0,
    delai_moyen_jours: kpis?.delai_count ? Math.round((kpis.delai_total / kpis.delai_count) * 10) / 10 : null,
    situations,
    objectifs: {
      mobilite: motifs.mobilite || 0,
      logement: motifs.logement || 0,
      sante: motifs.sante || 0,
      finance: motifs.finance || 0,
      administratif: motifs.administratif || 0,
      social_familial: motifs.social_familial || 0,
      reorientation: motifs.reorientation || 0,
      recherche_emploi: motifs.recherche_emploi || 0,
      autre: motifs.autre || 0,
      total_dossiers: kpis?.envoyes ?? 0,
    },
    nps,
    mensuel: mensuel.mois,
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
