import { useQuery } from "@tanstack/react-query";
import { _get } from "../../../../common/httpClient";
import { initFields } from "../initFields";
import { cerfaSchema } from "../cerfaSchema";
import { useRecoilValue } from "recoil";
import { dossierAtom } from "../../atoms";

export const useInitCerfa = ({ controller }) => {
  const dossier = useRecoilValue(dossierAtom);

  const { isLoading } = useQuery(
    ["cerfa", dossier?._id],
    async () => {
      if (!dossier?._id) return;
      const cerfa = await _get(`/api/v1/cerfa?dossierId=${dossier?._id}`);
      const fields = initFields({ cerfa, schema: cerfaSchema });
      controller.setFields(fields);
      return cerfa;
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  return { isLoading };
};
