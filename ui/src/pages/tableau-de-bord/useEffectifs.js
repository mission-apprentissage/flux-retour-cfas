import { subYears } from "date-fns";
import { useEffect, useState } from "react";

import { _post } from "../../common/httpClient";
import { getPercentageDifference } from "../../common/utils/calculUtils";
import { omitNullishValues } from "../../common/utils/omitNullishValues";
import { useFiltersContext } from "./FiltersContext";

const mapEffectifsData = (effectifsData) => {
  const [start, end] = effectifsData;
  return {
    apprentis: {
      count: end.apprentis,
      evolution: getPercentageDifference(end.apprentis, start.apprentis),
    },
    inscrits: {
      count: end.inscrits,
      evolution: getPercentageDifference(end.inscrits, start.inscrits),
    },
    abandons: {
      count: end.abandons,
      evolution: getPercentageDifference(end.abandons, start.abandons),
    },
  };
};

// map filters to the expected body shape in our API and filter out null values
const buildSearchRequestBody = (filters) => {
  const flattenedFilters = {
    startDate: subYears(filters.date, 1).toISOString(),
    endDate: filters.date.toISOString(),
    etablissement_num_region: filters.region?.code ?? null,
    etablissement_num_departement: filters.departement?.code ?? null,
    formation_cfd: filters.formation?.cfd ?? null,
    siret_etablissement: filters.cfa?.siret_etablissement ?? null,
    etablissement_reseaux: filters.reseau?.nom ?? null,
  };

  return omitNullishValues(flattenedFilters);
};

const useEffectifs = () => {
  const [effectifs, setEffectifs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const filtersContext = useFiltersContext();

  const searchRequestBody = buildSearchRequestBody(filtersContext.state);
  useEffect(() => {
    const fetchEffectifs = async () => {
      setLoading(true);
      try {
        const response = await _post("/api/dashboard/effectifs", searchRequestBody);
        setEffectifs(mapEffectifsData(response));
        setError(null);
      } catch (err) {
        setError(err);
        setEffectifs(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEffectifs();
  }, [JSON.stringify(searchRequestBody)]);

  return [effectifs, loading, error];
};

export default useEffectifs;
