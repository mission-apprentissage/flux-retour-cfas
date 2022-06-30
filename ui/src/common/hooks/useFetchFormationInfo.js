import { useQuery } from "react-query";

import { fetchFormation } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";

const useFetchFormationInfo = (formationCfd) => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.FORMATION, formationCfd], () => fetchFormation(formationCfd));

  return { data, loading: isLoading, error };
};

export default useFetchFormationInfo;
