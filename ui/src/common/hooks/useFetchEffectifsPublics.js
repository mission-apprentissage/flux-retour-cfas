import { useQuery } from "react-query";

import { fetchEffectifsPublics } from "../api/tableauDeBord";
import { QUERY_KEYS } from "../constants/queryKeys";

const useFetchEffectifsPublics = () => {
  const { data, isLoading, error } = useQuery([QUERY_KEYS.EFFECTIFS_PUBLICS], () => fetchEffectifsPublics());

  return { data, loading: isLoading, error };
};

export default useFetchEffectifsPublics;
