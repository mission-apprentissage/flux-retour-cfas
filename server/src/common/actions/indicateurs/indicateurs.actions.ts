import { Collection, ObjectId } from "mongodb";
import { IndicateursEffectifs, STATUT_APPRENANT } from "shared";

import { EffectifsFiltersTerritoire, combineFilters } from "@/common/actions/helpers/filters";
import { findOrganismesFormateursIdsOfOrganisme } from "@/common/actions/helpers/permissions";
import { AuthContext } from "@/common/model/internal/AuthContext";

import { buildEffectifMongoFilters } from "./effectifs/effectifs-filters";
import { buildDECAFilter } from "./indicateurs-with-deca.actions";

export const createDernierStatutFieldPipeline = (date: Date) => [
  {
    $addFields: {
      dernierStatut: {
        $arrayElemAt: [
          {
            $filter: {
              input: "$_computed.statut.parcours",
              as: "statut",
              cond: {
                $lte: ["$$statut.date", date],
              },
            },
          },
          -1,
        ],
      },
    },
  },
  {
    $addFields: {
      dernierStatutDureeInDay: {
        $dateDiff: { startDate: "$dernierStatut.date", endDate: date, unit: "day" },
      },
    },
  },
];

export function buildIndicateursEffectifsPipeline(
  groupBy: string | null | Record<string, string>,
  currentDate: Date,
  extraAccumulator: Record<string, unknown> = {},
  customMatchAggregation: Array<Record<string, string>> | null = null
) {
  const firstStage = customMatchAggregation ?? createDernierStatutFieldPipeline(currentDate);
  return [
    ...firstStage,
    {
      $group: {
        _id: groupBy,
        apprentis: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.APPRENTI] }, 1, 0],
          },
        },
        inscrits: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.INSCRIT] }, 1, 0],
          },
        },
        abandons: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.ABANDON] }, 1, 0],
          },
        },
        rupturants: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.RUPTURANT] }, 1, 0],
          },
        },
        finDeFormation: {
          $sum: {
            $cond: [{ $eq: ["$dernierStatut.valeur", STATUT_APPRENANT.FIN_DE_FORMATION] }, 1, 0],
          },
        },
        ...extraAccumulator,
      },
    },
    {
      $project: {
        apprenants: {
          $sum: ["$apprentis", "$inscrits", "$rupturants", "$finDeFormation"],
        },
        apprentis: {
          $sum: ["$apprentis", "$finDeFormation"],
        },
        inscrits: 1,
        abandons: 1,
        rupturants: 1,
        finDeFormation: 1,
        ...Object.entries(extraAccumulator).reduce((acc, [key]) => ({ ...acc, [key]: 1 }), {}),
      },
    },
  ];
}

export async function getOrganismeIndicateursEffectifsGenerique(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: EffectifsFiltersTerritoire,
  db: Collection<any>,
  decaMode: boolean = false
): Promise<IndicateursEffectifs> {
  const indicateurs = (await db
    .aggregate([
      {
        $match: combineFilters(
          await getOrganismeRestriction(organismeId),
          buildDECAFilter(decaMode),
          ...buildEffectifMongoFilters(filters, ctx.acl.indicateursEffectifs)
        ),
      },
      ...buildIndicateursEffectifsPipeline(null, filters.date),
      {
        $project: {
          _id: 0,
          apprenants: 1,
          apprentis: 1,
          inscrits: 1,
          abandons: 1,
          rupturants: 1,
        },
      },
    ])
    .next()) as IndicateursEffectifs;
  return (
    indicateurs ?? {
      apprenants: 0,
      apprentis: 0,
      inscrits: 0,
      abandons: 0,
      rupturants: 0,
    }
  );
}

async function getOrganismeRestriction(organismeId?: ObjectId) {
  return organismeId
    ? { organisme_id: { $in: [organismeId, ...(await findOrganismesFormateursIdsOfOrganisme(organismeId, true))] } }
    : {};
}
