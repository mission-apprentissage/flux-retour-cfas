import { effectifsDb } from "@/common/model/collections";

import { DateFilters } from "../helpers/filters";

import { buildIndicateursEffectifsPipeline } from "./indicateurs.actions";

export const getEffectifIndicateursForMissionLocaleId = async (filters: DateFilters, missionLocaleId: number) => {
  const aggregation = [
    {
      $match: {
        "apprenant.adresse.mission_locale_id": missionLocaleId,
      },
    },
    ...buildIndicateursEffectifsPipeline(null, filters.date),
    {
      $project: {
        _id: 0,
        inscrits: 1,
        abandons: 1,
        rupturants: 1,
      },
    },
  ];
  const indicateurs = await effectifsDb().aggregate(aggregation).toArray();
  return indicateurs ?? { inscrits: 0, abandons: 0, rupturants: 0 };
};
