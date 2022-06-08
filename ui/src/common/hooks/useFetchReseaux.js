import { useQuery } from "react-query";

import { fetchReseaux } from "../api/tableauDeBord";

const useFetchReseaux = () => {
  const { data, isLoading, error } = useQuery("reseaux", () => fetchReseaux(), { staleTime: Infinity });

  return { data, loading: isLoading, error };
};

export default useFetchReseaux;
