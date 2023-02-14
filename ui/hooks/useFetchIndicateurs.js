import { omitNullishValues } from "@/common/utils/omitNullishValues.js";
import { useSimpleFiltersContext } from "@/modules/mon-espace/landing/common/SimpleFiltersContext.js";
import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";

/**
 * TODO Refacto ? Placer ailleurs ?
 * harmoniser si besoin avec @/common/utils/mapFiltersToApiFormat.js
 * @param {*} filters
 * @returns
 */
function mapSimpleFiltersToApiFormat(filtersValues) {
  return omitNullishValues({
    date: filtersValues?.date.toISOString(),
    organisme_id: filtersValues.organismeId,
    etablissement_num_departement: filtersValues?.departement?.code,
    etablissement_num_region: filtersValues?.region?.code,
  });
}

const useFetchIndicateurs = () => {
  const { filtersValues } = useSimpleFiltersContext();
  const requestFilters = mapSimpleFiltersToApiFormat(filtersValues);

  const { status, indicateurs, error } = useQuery(["indicateurs", requestFilters], () =>
    _get("/api/indicateurs", { params: requestFilters })
  );

  const loading = status === "loading";
  return [indicateurs, loading, error];
};

export default useFetchIndicateurs;
