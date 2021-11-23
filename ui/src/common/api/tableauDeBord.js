import qs from "query-string";

import { _get } from "../httpClient";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

export const fetchEffectifs = (filters) => {
  const queryParameters = qs.stringify(mapFiltersToApiFormat(filters));
  const url = `/api/dashboard/effectifs?${queryParameters}`;
  return _get(url);
};
