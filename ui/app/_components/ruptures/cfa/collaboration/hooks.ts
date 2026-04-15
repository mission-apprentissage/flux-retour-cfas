"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IEffectifMissionLocale } from "shared";
import { IVerifiedInfo } from "shared/models/data/missionLocaleEffectif.model";
import { IUpdateMissionLocaleEffectifOrganisme } from "shared/models/routes/organismes/mission-locale/missions-locale.api";

import { cfaQueryKeys } from "@/app/_components/ruptures/cfa/hooks/useCfaQueries";
import { useAuth } from "@/app/_context/UserContext";
import { _get, _put } from "@/common/httpClient";

export type VerifiedInfo = { [K in keyof IVerifiedInfo]-?: string };

type CollaborationFormPayload = Required<
  Pick<
    IUpdateMissionLocaleEffectifOrganisme,
    "still_at_cfa" | "motif" | "commentaires_par_motif" | "cause_rupture" | "referent_type" | "referent_coordonnees"
  >
> & {
  note_complementaire?: string;
  verified_info: VerifiedInfo;
};

export function useCfaEffectifDetail(id: string) {
  const { user } = useAuth();

  return useQuery(
    ["effectif", id],
    async () => {
      if (!id) return null;
      return await _get<IEffectifMissionLocale>(
        `/api/v1/organismes/${user?.organisation?.organisme_id}/cfa/effectif/${id}`
      );
    },
    {
      enabled: !!id,
      suspense: true,
      useErrorBoundary: true,
    }
  );
}

export function useSubmitCollaborationForm(effectifId: string, onSuccess: () => void) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CollaborationFormPayload) => {
      const organismeId = user?.organisation?.organisme_id;
      return _put(`/api/v1/organismes/${organismeId}/mission-locale/effectif/${effectifId}`, {
        rupture: true,
        acc_conjoint: true,
        motif: payload.motif,
        still_at_cfa: payload.still_at_cfa,
        commentaires_par_motif: payload.commentaires_par_motif,
        cause_rupture: payload.cause_rupture,
        referent_type: payload.referent_type,
        referent_coordonnees: payload.referent_coordonnees,
        note_complementaire: payload.note_complementaire || undefined,
        verified_info: payload.verified_info,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["effectif"]);
      queryClient.invalidateQueries(cfaQueryKeys.all);
      onSuccess();
    },
  });
}
