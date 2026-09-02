import { useSuspenseQuery } from "@tanstack/react-query";
import { API_EFFECTIF_LISTE } from "shared";

import { PostalCodeOption } from "@/app/_utils/ruptures.utils";
import { _get } from "@/common/httpClient";
import type { MlListeResponse } from "@/common/types/ruptures";

import { triEnQuery, type MlTriEtat } from "./tri";

export type NomListeFusionnee =
  | API_EFFECTIF_LISTE.A_TRAITER_OU_RECONTACTER
  | API_EFFECTIF_LISTE.COLLAB_A_TRAITER_OU_RECONTACTER
  | API_EFFECTIF_LISTE.COLLAB_TRAITE;

export const mlListeQueryKey = (nomListe: NomListeFusionnee, tri?: MlTriEtat | null) =>
  ["mission-locale-liste", nomListe, tri?.colonne ?? null, tri?.ordre ?? null] as const;

/** Liste plate triée côté serveur : ordre de priorité par défaut, colonne demandée sinon. */
export function useMlListe(nomListe: NomListeFusionnee, tri?: MlTriEtat | null) {
  return useSuspenseQuery<MlListeResponse>({
    queryKey: mlListeQueryKey(nomListe, tri),
    queryFn: () => _get(`/api/v1/organisation/mission-locale/effectifs?nom_liste=${nomListe}${triEnQuery(tri)}`),
  });
}

export function useMlVilles() {
  return useSuspenseQuery<PostalCodeOption[]>({
    queryKey: ["mission-locale-villes"],
    queryFn: () => _get(`/api/v1/organisation/mission-locale/villes`),
  });
}
