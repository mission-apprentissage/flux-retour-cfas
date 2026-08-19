import { useQuery } from "@tanstack/react-query";
import { IReseau } from "shared";

import { _get } from "@/common/httpClient";

type UseTeteDeReseaux = {
  data: IReseau[] | null;
  isLoading: boolean;
};

export function useTeteDeReseaux(): UseTeteDeReseaux {
  const { data, isLoading } = useQuery<IReseau[]>(["tete_de_reseaux"], () => _get(`/api/v1/reseaux`), {});

  return {
    data: data || null,
    isLoading,
  };
}
