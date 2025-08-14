"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { API_EFFECTIF_LISTE, IEffecifMissionLocale } from "shared";

import EffectifDetail from "@/app/_components/ruptures/shared/ui/EffectifDetail";
import { _get, _post } from "@/common/httpClient";

export default function MissionLocaleDetailClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;

  const { data } = useQuery(
    ["effectif", id, nomListe],
    async () => {
      if (!id) return null;
      return await _get<IEffecifMissionLocale>(`/api/v1/organisation/mission-locale/effectif/${id}`, {
        params: {
          nom_liste: nomListe,
        },
      });
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );

  if (!data) return null;
  return <EffectifDetail data={data} />;
}
