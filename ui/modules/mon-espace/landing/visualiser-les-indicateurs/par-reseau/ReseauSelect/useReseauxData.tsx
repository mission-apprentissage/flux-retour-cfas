import { useQuery } from "@tanstack/react-query";

import { _get } from "@/common/httpClient";
import { sortAlphabeticallyBy } from "@/common/utils/sortAlphabetically";

const useReseauxData = () => {
  // reseaux are very unlikely to change during the user's session, thus the infinite staleTime
  const { data } = useQuery(["reseaux"], () => _get("/api/referentiel/networks"), { staleTime: Infinity });

  const reseauxSorted = sortAlphabeticallyBy("nom", data || []);

  return { data: reseauxSorted };
};

export default useReseauxData;
