import { useQuery } from "@tanstack/react-query";

import { _post } from "@/common/httpClient";

const useFetchEtablissements = ({ siret, uai, organismeFormation }) => {
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["uai-siret-adresse", { siret, uai, organismeFormation }],
    queryFn: () =>
      _post("/api/v1/auth/uai-siret-adresse", { siret, uai, organismeFormation }).then((rawData) =>
        rawData?.map(({ result }) => result)
      ),
    // note: we don't use `onSuccess` here, because not called if cache is used
    enabled: !!(siret || uai),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });
  return { data, isFetching, error, refetch };
};

export default useFetchEtablissements;
