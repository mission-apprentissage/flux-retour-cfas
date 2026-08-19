import { Collection, ObjectId } from "mongodb";
import { IndicateursEffectifs, ORGANISME_INDICATEURS_TYPE, STATUT_APPRENANT, hasRecentTransmissions } from "shared";

import { EffectifsFiltersTerritoire, combineFilters } from "@/common/actions/helpers/filters";
import { findOrganismesFormateursIdsOfOrganisme } from "@/common/actions/helpers/permissions";
import { organismesDb } from "@/common/model/collections";
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

export const getIndicateursForRelatedOrganismes = async (organismeId: ObjectId, indicateurType: string) => {
  const org = await organismesDb().findOne({ _id: organismeId });
  const organismesFormateurs = org?.organismesFormateurs;

  if (!organismesFormateurs) {
    return [];
  }

  // Initialise les indicateurs pour tous les organismes formateurs avec son propre organisme
  const allOrganismes = [org, ...organismesFormateurs];

  switch (indicateurType) {
    case ORGANISME_INDICATEURS_TYPE.SANS_EFFECTIFS:
      return allOrganismes.filter(({ last_transmission_date }) => !hasRecentTransmissions(last_transmission_date));
    case ORGANISME_INDICATEURS_TYPE.NATURE_INCONNUE:
      return allOrganismes.filter(({ nature }) => nature === "inconnue");
    case ORGANISME_INDICATEURS_TYPE.SIRET_FERME:
      return allOrganismes.filter(({ ferme }) => !!ferme);
    case ORGANISME_INDICATEURS_TYPE.UAI_NON_DETERMINE:
      return allOrganismes.filter(({ uai }) => !uai);
    default:
      return [];
  }
};
