import { ObjectId } from "bson";
import { COLLABORATION_CUTOFF_DATE, REPONDU_SITUATIONS } from "shared/constants/collaboration";
import { REGIONS_BY_CODE } from "shared/constants/territoires";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { addDaysUTC, normalizeToUTCDay, subtractDaysUTC } from "shared/utils/date";

import { findEligibleOrganismes, type IEligibleOrganismeRow } from "@/common/actions/organismes/deca-cfa-eligibility";
import { missionLocaleEffectifsDb, organisationsDb } from "@/common/model/collections";

export type IStatWithVariation = { current: number; variation: string };

export type ICompatibleOrganisme = {
  _id: ObjectId;
  siret: string;
  nom: string | null;
  region: string | null;
  is_allowed_deca: boolean;
  has_effectifs_erp: boolean;
  has_effectifs_deca: boolean;
  date_activation: Date | null;
};

export type ICollaborationRegionRow = {
  region_code: string;
  region_nom: string;
  cfa_compatibles: number;
  cfa_actives: number;
  cfa_with_collab: number;
  rupturants: number;
  dossiers_envoyes_cfa: number;
};

export type ICollaborationStatsSnapshot = {
  national: {
    activation: { cfa_compatibles: number; cfa_actives: number; cfa_with_collab: number };
    usage: {
      rupturants: number;
      dossiers_envoyes_cfa: number;
      dossiers_traites_ml: number;
      jeunes_repondus: number;
      rdv_pris: number;
    };
  };
  regions: ICollaborationRegionRow[];
};

export type ICollaborationStatsResponse = {
  evaluation_date: Date;
  cutoff_date: Date;
  national: {
    activation: {
      cfa_compatibles: IStatWithVariation;
      cfa_actives: IStatWithVariation;
      cfa_with_collab: IStatWithVariation;
    };
    usage: {
      rupturants: IStatWithVariation;
      dossiers_envoyes_cfa: IStatWithVariation;
      dossiers_traites_ml: IStatWithVariation;
      jeunes_repondus: IStatWithVariation;
      rdv_pris: IStatWithVariation;
    };
  };
  regions: Array<{
    region_code: string;
    region_nom: string;
    cfa_compatibles: number;
    cfa_actives: { current: number; delta: number };
    cfa_with_collab: { current: number; delta: number };
    rupturants: number;
    dossiers_envoyes_cfa: number;
  }>;
};

async function attachActivationDates(
  eligible: IEligibleOrganismeRow[],
  endExclusive: Date
): Promise<ICompatibleOrganisme[]> {
  if (eligible.length === 0) return [];

  const orgIdStrings = eligible.map((o) => o._id.toString());

  const activations = await organisationsDb()
    .aggregate<{ _id: string; date_activation: Date }>([
      {
        $match: {
          type: "ORGANISME_FORMATION",
          organisme_id: { $in: orgIdStrings },
          ml_beta_activated_at: { $type: "date", $lt: endExclusive },
        },
      },
      { $group: { _id: "$organisme_id", date_activation: { $min: "$ml_beta_activated_at" } } },
    ])
    .toArray();

  const activationByOrgId = new Map(activations.map((a) => [a._id, a.date_activation]));

  return eligible.map((org) => ({
    _id: org._id,
    siret: org.siret,
    nom: org.nom,
    region: org.region,
    is_allowed_deca: org.is_allowed_deca,
    has_effectifs_erp: org.has_effectifs_erp,
    has_effectifs_deca: org.has_effectifs_deca,
    date_activation: activationByOrgId.get(org._id.toString()) ?? null,
  }));
}

export async function fetchCompatibleOrganismes(endExclusive: Date): Promise<ICompatibleOrganisme[]> {
  const eligible = await findEligibleOrganismes();
  return attachActivationDates(eligible, endExclusive);
}

type UsageRow = {
  organisme_id: ObjectId;
  region: string | null;
  rupturants: number;
  dossiers_envoyes_cfa: number;
  dossiers_traites_ml: number;
  jeunes_repondus: number;
  rdv_pris: number;
};

type RegionUsageAccumulator = {
  rupturants: number;
  dossiers_envoyes_cfa: number;
  cfa_with_collab: number;
};

async function computeUsage(
  endExclusive: Date,
  activatedOrganismeIds: Set<string>
): Promise<{
  national: ICollaborationStatsSnapshot["national"]["usage"];
  perRegion: Map<string, RegionUsageAccumulator>;
  cfaWithCollabNational: number;
}> {
  const activatedObjectIds = Array.from(activatedOrganismeIds, (id) => new ObjectId(id));

  const cursor = missionLocaleEffectifsDb().aggregate<UsageRow>([
    {
      $match: {
        soft_deleted: { $ne: true },
        "effectif_snapshot.organisme_id": { $in: activatedObjectIds },
        $or: [
          { created_at: { $gte: COLLABORATION_CUTOFF_DATE, $lt: endExclusive } },
          { "organisme_data.reponse_at": { $gte: COLLABORATION_CUTOFF_DATE, $lt: endExclusive } },
        ],
      },
    },
    {
      $addFields: {
        is_rupturant: {
          $and: [{ $gte: ["$created_at", COLLABORATION_CUTOFF_DATE] }, { $lt: ["$created_at", endExclusive] }],
        },
        is_envoye: {
          $and: [
            { $gte: ["$organisme_data.reponse_at", COLLABORATION_CUTOFF_DATE] },
            { $lt: ["$organisme_data.reponse_at", endExclusive] },
          ],
        },
      },
    },
    {
      $addFields: {
        is_traite: { $and: ["$is_envoye", { $ne: [{ $ifNull: ["$situation", null] }, null] }] },
        is_repondu: { $and: ["$is_envoye", { $in: ["$situation", REPONDU_SITUATIONS] }] },
        is_rdv: { $and: ["$is_envoye", { $eq: ["$situation", SITUATION_ENUM.RDV_PRIS] }] },
      },
    },
    {
      $group: {
        _id: "$effectif_snapshot.organisme_id",
        region_snapshot: { $first: "$effectif_snapshot._computed.organisme.region" },
        rupturants: { $sum: { $cond: ["$is_rupturant", 1, 0] } },
        dossiers_envoyes_cfa: { $sum: { $cond: ["$is_envoye", 1, 0] } },
        dossiers_traites_ml: { $sum: { $cond: ["$is_traite", 1, 0] } },
        jeunes_repondus: { $sum: { $cond: ["$is_repondu", 1, 0] } },
        rdv_pris: { $sum: { $cond: ["$is_rdv", 1, 0] } },
      },
    },
    {
      $lookup: {
        from: "organismes",
        localField: "_id",
        foreignField: "_id",
        as: "organisme",
        pipeline: [{ $project: { "adresse.region": 1 } }],
      },
    },
    {
      $project: {
        _id: 0,
        organisme_id: "$_id",
        region: {
          $ifNull: [{ $arrayElemAt: ["$organisme.adresse.region", 0] }, "$region_snapshot"],
        },
        rupturants: 1,
        dossiers_envoyes_cfa: 1,
        dossiers_traites_ml: 1,
        jeunes_repondus: 1,
        rdv_pris: 1,
      },
    },
  ]);

  const national: ICollaborationStatsSnapshot["national"]["usage"] = {
    rupturants: 0,
    dossiers_envoyes_cfa: 0,
    dossiers_traites_ml: 0,
    jeunes_repondus: 0,
    rdv_pris: 0,
  };
  const perRegion = new Map<string, RegionUsageAccumulator>();
  let cfaWithCollabNational = 0;

  for await (const row of cursor) {
    const hasEnvoye = row.dossiers_envoyes_cfa > 0;

    national.rupturants += row.rupturants;
    national.dossiers_envoyes_cfa += row.dossiers_envoyes_cfa;
    national.dossiers_traites_ml += row.dossiers_traites_ml;
    national.jeunes_repondus += row.jeunes_repondus;
    national.rdv_pris += row.rdv_pris;
    if (hasEnvoye) cfaWithCollabNational += 1;

    const code = row.region ?? null;
    if (!code) continue;
    const current = perRegion.get(code) ?? { rupturants: 0, dossiers_envoyes_cfa: 0, cfa_with_collab: 0 };
    current.rupturants += row.rupturants;
    current.dossiers_envoyes_cfa += row.dossiers_envoyes_cfa;
    if (hasEnvoye) current.cfa_with_collab += 1;
    perRegion.set(code, current);
  }

  return { national, perRegion, cfaWithCollabNational };
}

type ActivationAggregates = {
  national: { cfa_compatibles: number; cfa_actives: number };
  perRegion: Map<string, { cfa_compatibles: number; cfa_actives: number }>;
  activatedOrganismeIds: Set<string>;
};

function aggregateActivation(compatibles: ICompatibleOrganisme[]): ActivationAggregates {
  const perRegion = new Map<string, { cfa_compatibles: number; cfa_actives: number }>();
  const activatedOrganismeIds = new Set<string>();
  let totalCompatibles = 0;
  let totalActives = 0;

  for (const org of compatibles) {
    totalCompatibles += 1;
    const isActive = org.date_activation !== null;
    if (isActive) {
      totalActives += 1;
      activatedOrganismeIds.add(org._id.toString());
    }
    if (!org.region) continue;
    const current = perRegion.get(org.region) ?? { cfa_compatibles: 0, cfa_actives: 0 };
    current.cfa_compatibles += 1;
    if (isActive) current.cfa_actives += 1;
    perRegion.set(org.region, current);
  }

  return {
    national: { cfa_compatibles: totalCompatibles, cfa_actives: totalActives },
    perRegion,
    activatedOrganismeIds,
  };
}

async function computeStatsForEligible(
  endExclusive: Date,
  eligible: IEligibleOrganismeRow[]
): Promise<ICollaborationStatsSnapshot> {
  const compatibles = await attachActivationDates(eligible, endExclusive);
  const activation = aggregateActivation(compatibles);
  const usage = await computeUsage(endExclusive, activation.activatedOrganismeIds);

  const regionCodes = new Set<string>([...activation.perRegion.keys(), ...usage.perRegion.keys()]);

  const regions: ICollaborationRegionRow[] = Array.from(regionCodes)
    .map((code) => {
      const activ = activation.perRegion.get(code) ?? { cfa_compatibles: 0, cfa_actives: 0 };
      const us = usage.perRegion.get(code) ?? { rupturants: 0, dossiers_envoyes_cfa: 0, cfa_with_collab: 0 };
      const region = REGIONS_BY_CODE[code as keyof typeof REGIONS_BY_CODE];
      return {
        region_code: code,
        region_nom: region?.nom ?? code,
        cfa_compatibles: activ.cfa_compatibles,
        cfa_actives: activ.cfa_actives,
        cfa_with_collab: us.cfa_with_collab,
        rupturants: us.rupturants,
        dossiers_envoyes_cfa: us.dossiers_envoyes_cfa,
      };
    })
    .sort((a, b) => a.region_nom.localeCompare(b.region_nom, "fr"));

  return {
    national: {
      activation: {
        ...activation.national,
        cfa_with_collab: usage.cfaWithCollabNational,
      },
      usage: usage.national,
    },
    regions,
  };
}

export async function computeStatsForDate(endExclusive: Date): Promise<ICollaborationStatsSnapshot> {
  const eligible = await findEligibleOrganismes();
  return computeStatsForEligible(endExclusive, eligible);
}

function buildVariation(current: number, previous: number | null): IStatWithVariation {
  if (previous === null || previous === 0) return { current, variation: "" };
  const pct = Math.round(((current - previous) / previous) * 100);
  const sign = pct > 0 ? "+" : "";
  return { current, variation: `${sign}${pct}%` };
}

export async function getCollaborationStats(referenceDate?: Date): Promise<ICollaborationStatsResponse> {
  const today = normalizeToUTCDay(referenceDate ?? new Date());
  const todayEnd = addDaysUTC(today, 1);
  const j7End = subtractDaysUTC(todayEnd, 7);

  const eligible = await findEligibleOrganismes();
  const [current, previous] = await Promise.all([
    computeStatsForEligible(todayEnd, eligible),
    computeStatsForEligible(j7End, eligible),
  ]);

  const previousByRegion = new Map(previous.regions.map((r) => [r.region_code, r]));

  return {
    evaluation_date: today,
    cutoff_date: COLLABORATION_CUTOFF_DATE,
    national: {
      activation: {
        cfa_compatibles: buildVariation(current.national.activation.cfa_compatibles, null),
        cfa_actives: buildVariation(current.national.activation.cfa_actives, previous.national.activation.cfa_actives),
        cfa_with_collab: buildVariation(
          current.national.activation.cfa_with_collab,
          previous.national.activation.cfa_with_collab
        ),
      },
      usage: {
        rupturants: buildVariation(current.national.usage.rupturants, previous.national.usage.rupturants),
        dossiers_envoyes_cfa: buildVariation(
          current.national.usage.dossiers_envoyes_cfa,
          previous.national.usage.dossiers_envoyes_cfa
        ),
        dossiers_traites_ml: buildVariation(
          current.national.usage.dossiers_traites_ml,
          previous.national.usage.dossiers_traites_ml
        ),
        jeunes_repondus: buildVariation(
          current.national.usage.jeunes_repondus,
          previous.national.usage.jeunes_repondus
        ),
        rdv_pris: buildVariation(current.national.usage.rdv_pris, previous.national.usage.rdv_pris),
      },
    },
    regions: current.regions.map((row) => {
      const prev = previousByRegion.get(row.region_code);
      return {
        region_code: row.region_code,
        region_nom: row.region_nom,
        cfa_compatibles: row.cfa_compatibles,
        cfa_actives: { current: row.cfa_actives, delta: row.cfa_actives - (prev?.cfa_actives ?? 0) },
        cfa_with_collab: {
          current: row.cfa_with_collab,
          delta: row.cfa_with_collab - (prev?.cfa_with_collab ?? 0),
        },
        rupturants: row.rupturants,
        dossiers_envoyes_cfa: row.dossiers_envoyes_cfa,
      };
    }),
  };
}
