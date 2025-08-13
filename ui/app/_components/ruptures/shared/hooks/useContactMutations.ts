import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SITUATION_ENUM } from "shared";

import { _post } from "@/common/httpClient";

import { effectifQueryKeys } from "./useEffectifQueries";

interface ContactPayload {
  situation?: SITUATION_ENUM | null;
  situation_autre?: string;
  commentaires?: string;
  deja_connu?: boolean;
}

const recordContact = async ({ effectifId, payload }: { effectifId: string; payload: ContactPayload }) => {
  return _post(`/api/v1/organisation/mission-locale/effectif/${effectifId}`, payload);
};

export const createContactSuccessPayload = (
  situation: SITUATION_ENUM,
  situationAutre?: string,
  commentaires?: string,
  dejaConnu?: boolean
): ContactPayload => ({
  situation,
  situation_autre: situation === SITUATION_ENUM.AUTRE ? situationAutre : undefined,
  commentaires: commentaires || undefined,
  deja_connu: dejaConnu || undefined,
});

export const createContactFailurePayload = (probleme: string, action: "garder" | "traiter"): ContactPayload => ({
  situation: action === "traiter" ? SITUATION_ENUM.CONTACTE_SANS_RETOUR : null,
  commentaires: probleme,
});

export function useRecordContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: recordContact,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.detail(variables.effectifId) });
      queryClient.invalidateQueries({ queryKey: effectifQueryKeys.all });
    },
  });
}
