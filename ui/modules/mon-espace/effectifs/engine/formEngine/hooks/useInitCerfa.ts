import { useQuery } from "@tanstack/react-query";
import { useRecoilValue } from "recoil";

import { _get } from "../../../../../../common/httpClient";
import { initFields } from "../initFields";
import { cerfaSchema } from "../cerfaSchema";
import { effectifIdAtom } from "../../atoms";
import { organismeAtom } from "../../../../../../hooks/organismeAtoms";

// eslint-disable-next-line no-undef
// const sleep = (m) => new Promise((r) => setTimeout(r, m));

export const useInitCerfa = ({ controller, modeSifa, canEdit, effectifsSnapshot = false }) => {
  const effectifId = useRecoilValue<any>(effectifIdAtom);
  const organisme = useRecoilValue<any>(organismeAtom);

  const { isLoading, isFetching } = useQuery(
    ["effectif", effectifId],
    async () => {
      if (!effectifId) return null;
      const cerfa = await _get(`/api/v1/effectif/${effectifId}${effectifsSnapshot ? "/snapshot" : ""}`, {
        params: { organisme_id: organisme._id },
      });
      // await sleep(300); // TODO SPECIAL UX
      const fields = initFields({ cerfa, schema: cerfaSchema, modeSifa, canEdit, organisme });
      controller.setFields(fields);
      return cerfa;
    },
    {
      refetchOnMount: false,
    }
  );

  return { isLoading: isLoading || isFetching };
};
