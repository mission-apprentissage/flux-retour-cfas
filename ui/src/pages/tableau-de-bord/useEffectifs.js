import { usePostFetch } from "../../common/hooks/useFetch";
import { omitNullishValues } from "../../common/utils/omitNullishValues";
import { useFiltersContext } from "./FiltersContext";

const mapEffectifsData = (effectifsData) => {
  return {
    apprentis: {
      count: effectifsData.apprentis,
    },
    inscritsSansContrat: {
      count: effectifsData.inscritsSansContrat,
    },
    rupturants: {
      count: effectifsData.rupturants,
    },
    abandons: {
      count: effectifsData.abandons,
    },
  };
};

// map filters to the expected body shape in our API and filter out null values
const buildSearchRequestBody = (filters) => {
  const flattenedFilters = {
    date: filters.date.toISOString(),
    etablissement_num_region: filters.region?.code ?? null,
    etablissement_num_departement: filters.departement?.code ?? null,
    formation_cfd: filters.formation?.cfd ?? null,
    uai_etablissement: filters.cfa?.uai_etablissement ?? null,
    siret_etablissement: filters.sousEtablissement?.siret_etablissement ?? null,
    etablissement_reseaux: filters.reseau?.nom ?? null,
  };

  return omitNullishValues(flattenedFilters);
};

const useEffectifs = () => {
  const filtersContext = useFiltersContext();

  const searchRequestBody = buildSearchRequestBody(filtersContext.state);
  const [data, loading, error] = usePostFetch("/api/dashboard/effectifs", searchRequestBody);

  const effectifs = data && mapEffectifsData(data);

  return [effectifs, loading, error];
};

export default useEffectifs;
