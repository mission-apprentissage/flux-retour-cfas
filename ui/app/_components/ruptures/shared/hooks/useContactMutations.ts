import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SITUATION_ENUM, PROBLEME_TYPE_ENUM } from "shared";

import { _post } from "@/common/httpClient";

import { effectifQueryKeys } from "./useEffectifQueries";

interface ContactPayload {
  situation?: SITUATION_ENUM | null;
  situation_autre?: string;
  commentaires?: string;
  deja_connu?: boolean;
  probleme_type?: PROBLEME_TYPE_ENUM;
  probleme_detail?: string;
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

export const createContactFailurePayload = (
  probleme: string,
  problemeAutre: string,
  action: "garder" | "traiter"
): ContactPayload => {
  const getSituationFromProbleme = (problemeType: string, actionType: "garder" | "traiter") => {
    if (actionType === "garder") {
      return SITUATION_ENUM.CONTACTE_SANS_RETOUR;
    }

    switch (problemeType) {
      case PROBLEME_TYPE_ENUM.COORDONNEES_INCORRECTES:
        return SITUATION_ENUM.COORDONNEES_INCORRECT;
      case PROBLEME_TYPE_ENUM.JEUNE_INJOIGNABLE:
        return SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES;
      case PROBLEME_TYPE_ENUM.AUTRE:
        return SITUATION_ENUM.AUTRE;
      default:
        return SITUATION_ENUM.CONTACTE_SANS_RETOUR;
    }
  };

  const situation = getSituationFromProbleme(probleme, action);

  return {
    situation,
    situation_autre: situation === SITUATION_ENUM.AUTRE ? problemeAutre : undefined,
    probleme_type: probleme as PROBLEME_TYPE_ENUM,
    probleme_detail: probleme === PROBLEME_TYPE_ENUM.AUTRE ? problemeAutre : undefined,
  };
};

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
