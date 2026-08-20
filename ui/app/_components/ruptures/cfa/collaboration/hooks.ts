"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { IEffectifMissionLocale } from "shared";
import { CFA_SITUATION_TYPE_ENUM, IVerifiedInfo } from "shared/models/data/missionLocaleEffectif.model";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { cfaQueryKeys } from "@/app/_components/ruptures/cfa/hooks/useCfaQueries";
import { useAuth } from "@/app/_context/UserContext";
import { _get, _put } from "@/common/httpClient";

export type VerifiedInfo = { [_K in keyof Omit<IVerifiedInfo, "rqth_declare" | "responsable_legal">]-?: string };

type CollaborationFormPayload = Omit<
  IUpdateMissionLocaleEffectifOrganisme,
  "rupture" | "acc_conjoint" | "verified_info" | "date_rupture" | "date_abandon" | "date_debut_formation"
> & {
  situation_type: CFA_SITUATION_TYPE_ENUM;
  verified_info: Record<string, unknown>;
  // Les dates transitent en ISO court (input type=date), le serveur les coerce.
  date_rupture?: string;
  date_abandon?: string;
  date_debut_formation?: string;
};

export function useCfaEffectifDetail(id: string) {
  const { user } = useAuth();

  return useSuspenseQuery({
    queryKey: ["effectif", id],

    queryFn: async () => {
      if (!id) return null;
      return await _get<IEffectifMissionLocale>(
        `/api/v1/organismes/${user?.organisation?.organisme_id}/cfa/effectif/${id}`
      );
    },
  });
}

export function useSubmitCollaborationForm(effectifId: string, onSuccess: () => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CollaborationFormPayload) => {
      const organismeId = user?.organisation?.organisme_id;
      return _put(`/api/v1/organismes/${organismeId}/mission-locale/effectif/${effectifId}`, {
        rupture: payload.situation_type === CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
        acc_conjoint: true,
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["effectif"],
      });
      queryClient.invalidateQueries({ queryKey: cfaQueryKeys.all });
      onSuccess();
    },
  });
}
