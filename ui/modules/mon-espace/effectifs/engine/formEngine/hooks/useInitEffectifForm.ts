import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

import { _get } from "@/common/httpClient";
import { organismeAtom } from "@/hooks/organismeAtoms";
import { effectifIdAtom } from "@/modules/mon-espace/effectifs/engine/atoms";
import { effectifFormSchema } from "@/modules/mon-espace/effectifs/engine/formEngine/effectifFormSchema";
import { initFields } from "@/modules/mon-espace/effectifs/engine/formEngine/initFields";

// eslint-disable-next-line no-undef
// const sleep = (m) => new Promise((r) => setTimeout(r, m));

export const useInitEffectifForm = ({ controller, modeSifa, canEdit, effectifsSnapshot = false }) => {
  const effectifId = useRecoilValue<any>(effectifIdAtom);
  const organisme = useRecoilValue<any>(organismeAtom);

  const { isLoading, isFetching } = useQuery(
    ["effectif", effectifId],
    async () => {
      if (!effectifId) return null;
      const effectifForm = await _get(`/api/v1/effectif/${effectifId}${effectifsSnapshot ? "/snapshot" : ""}`, {
        params: { organisme_id: organisme._id },
      });
      // await sleep(300); // TODO SPECIAL UX
      const fields = initFields({ effectifForm, schema: effectifFormSchema, modeSifa, canEdit, organisme });
      controller.setFields(fields);
      return effectifForm;
    },
    {
      refetchOnMount: false,
    }
  );

  return { isLoading: isLoading || isFetching };
};
