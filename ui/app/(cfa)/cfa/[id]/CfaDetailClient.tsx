"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { API_EFFECTIF_LISTE, IEffectifMissionLocale } from "shared";

import { useMarkNotificationAsRead } from "@/app/_components/ruptures/shared/hooks/useNotificationMutations";
import EffectifDetail from "@/app/_components/ruptures/shared/ui/EffectifDetail";
import { useAuth } from "@/app/_context/UserContext";
import { _get } from "@/common/httpClient";

export default function CfaDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAsReadRef = useRef(markAsReadMutation.mutate);
  markAsReadRef.current = markAsReadMutation.mutate;

  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;
  const from = searchParams?.get("from");
  const source = searchParams?.get("source");

  const isCfaEffectifsView = from === "effectifs";

  const { data } = useQuery(
    ["effectif", id, nomListe, from, source],
    async () => {
      if (!id) return null;

      if (isCfaEffectifsView) {
        const params: Record<string, string> = {};
        if (source) params.source = source;
        const result = await _get<{ source: string; data: any }>(
          `/api/v1/organismes/${user?.organisation?.organisme_id}/cfa/effectif/${id}`,
          { params }
        );
        const effectifData =
          result.source === "missionLocaleEffectif" ? result.data : { ...result.data, effectif_snapshot: result.data };

        return {
          effectif: effectifData,
          currentIndex: 0,
          total: 1,
        } as IEffectifMissionLocale;
      }

      return await _get<IEffectifMissionLocale>(
        `/api/v1/organismes/${user?.organisation?.organisme_id}/mission-locale/effectif/${id}`,
        {
          params: {
            nom_liste: nomListe,
          },
        }
      );
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );

  useEffect(() => {
    if (data?.effectif?.unread_by_current_user === true && id && !user?.impersonating) {
      markAsReadRef.current(id, {
        onError: (error: unknown) => {
          console.error("Failed to mark notification as read:", error);
        },
      });
    }
  }, [data?.effectif?.unread_by_current_user, id, user?.impersonating]);

  if (!data) return null;
  return <EffectifDetail data={data} />;
}
