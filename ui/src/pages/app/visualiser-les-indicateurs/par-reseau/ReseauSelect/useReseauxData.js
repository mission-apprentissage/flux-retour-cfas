import { useQuery } from "react-query";

import { fetchReseaux } from "../../../../../common/api/tableauDeBord";
import { QUERY_KEYS } from "../../../../../common/constants/queryKey";
import { sortAlphabeticallyBy } from "../../../../../common/utils/sortAlphabetically";

const useReseauxData = () => {
  // reseaux are very unlikely during the user's session, thus the infinite staleTime
  const { data } = useQuery(QUERY_KEYS.reseaux, () => fetchReseaux(), { staleTime: Infinity });

  const reseauxSorted = sortAlphabeticallyBy("nom", data || []);

  return { data: reseauxSorted };
};

export default useReseauxData;
