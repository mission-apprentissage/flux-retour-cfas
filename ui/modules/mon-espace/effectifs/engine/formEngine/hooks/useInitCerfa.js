import { useQuery } from "@tanstack/react-query";
import { _get } from "../../../../../../common/httpClient";
import { initFields } from "../initFields";
import { cerfaSchema } from "../cerfaSchema";
import { useRecoilValue } from "recoil";
import { effectifIdAtom } from "../../atoms";

// eslint-disable-next-line no-undef
const sleep = (m) => new Promise((r) => setTimeout(r, m));

export const useInitCerfa = ({ controller }) => {
  const effectifId = useRecoilValue(effectifIdAtom);

  const { isLoading, isFetching } = useQuery(
    ["effectif", effectifId],
    async () => {
      if (!effectifId) return null;
      const cerfa = await _get(`/api/v1/effectif?effectifId=${effectifId}`);
      await sleep(300); // TODO SPECIAL
      const fields = initFields({ cerfa, schema: cerfaSchema });
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
