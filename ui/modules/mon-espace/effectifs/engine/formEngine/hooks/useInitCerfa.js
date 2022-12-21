import { useQuery } from "@tanstack/react-query";
import { _get } from "../../../../../../common/httpClient";
import { initFields } from "../initFields";
import { cerfaSchema } from "../cerfaSchema";
import { useRecoilValue } from "recoil";
import { effectifIdAtom } from "../../atoms";
import { organismeAtom } from "../../../../../../hooks/organismeAtoms";

// eslint-disable-next-line no-undef
const sleep = (m) => new Promise((r) => setTimeout(r, m));

export const useInitCerfa = ({ controller, modeSifa, canEdit, effectifsSnapshot = false }) => {
  const effectifId = useRecoilValue(effectifIdAtom);
  const organisme = useRecoilValue(organismeAtom);

  const { isLoading, isFetching } = useQuery(
    ["effectif", effectifId],
    async () => {
      if (!effectifId) return null;
      const cerfa = !effectifsSnapshot
        ? await _get(`/api/v1/effectif/${effectifId}?organisme_id=${organisme._id}`)
        : await _get(`/api/v1/effectif/${effectifId}/snapshot?organisme_id=${organisme._id}`);
      await sleep(300); // TODO SPECIAL UX
      const fields = initFields({ cerfa, schema: cerfaSchema, modeSifa, canEdit, organisme });
      controller.setFields(fields);
      return cerfa;
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  return { isLoading: isLoading || isFetching };
};
