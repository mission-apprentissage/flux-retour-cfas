import { useSuspenseQuery } from "@tanstack/react-query";
import { API_EFFECTIF_LISTE } from "shared";

import { PostalCodeOption } from "@/app/_utils/ruptures.utils";
import { _get } from "@/common/httpClient";
import type { MlListeResponse } from "@/common/types/ruptures";

export type NomListeFusionnee =
  | API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
  | API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER
  | API_EFFECTIF_LISTE.COLLAB_TRAITE;

export const mlListeQueryKey = (nomListe: NomListeFusionnee) => ["mission-locale-liste", nomListe] as const;

/** Liste plate triée côté serveur (nudge puis critères de priorité). */
export function useMlListe(nomListe: NomListeFusionnee) {
  return useSuspenseQuery<MlListeResponse>({
    queryKey: mlListeQueryKey(nomListe),
    queryFn: () => _get(`/api/v1/organisation/mission-locale/effectifs?nom_liste=${nomListe}`),
  });
}

export function useMlVilles() {
  return useSuspenseQuery<PostalCodeOption[]>({
    queryKey: ["mission-locale-villes"],
    queryFn: () => _get(`/api/v1/organisation/mission-locale/villes`),
  });
}
