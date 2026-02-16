"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { API_EFFECTIF_LISTE, IEffectifMissionLocale } from "shared";

import { useMarkNotificationAsRead } from "@/app/_components/ruptures/shared/hooks/useNotificationMutations";
import EffectifDetail from "@/app/_components/ruptures/shared/ui/EffectifDetail";
import { useAuth } from "@/app/_context/UserContext";
import { _get } from "@/common/httpClient";

export default function CfaDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const markAsReadMutation = useMarkNotificationAsRead();

  const searchParams = useSearchParams();
  const nomListe = (searchParams?.get("nom_liste") as API_EFFECTIF_LISTE) || API_EFFECTIF_LISTE.A_TRAITER;

  const { data } = useQuery(
    ["effectif", id, nomListe],
    async () => {
      if (!id) return null;
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
      markAsReadMutation.mutate(id, {
        onError: (error) => {
          console.error("Failed to mark notification as read:", error);
        },
      });
    }
  }, [data?.effectif?.unread_by_current_user, id, user?.impersonating]);

  if (!data) return null;
  return <EffectifDetail data={data} />;
}
