import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

import { _get } from "@/common/httpClient";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { effectifIdAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { effectifFormSchema } from "@/modules/mon-espace/effectifs/engine/formEngine/effectifFormSchema";
import { initFields } from "@/modules/mon-espace/effectifs/engine/formEngine/initFields";

export const useInitEffectifForm = ({ controller, canEdit }) => {
  const effectifId = useRecoilValue<any>(effectifIdAtom);
  const organisme = useRecoilValue<any>(organismeAtom);

  const { isLoading, isFetching } = useQuery(
    ["effectif", effectifId],
    async () => {
      if (!effectifId) return null;
      const effectifForm = await _get(`/api/v1/effectif/${effectifId}`);
      const fields = initFields({ effectifForm, schema: effectifFormSchema, canEdit, organisme });
      controller.setFields(fields);
      return effectifForm;
    },
    {
      refetchOnMount: false,
    }
  );

  return { isLoading: isLoading || isFetching };
};
